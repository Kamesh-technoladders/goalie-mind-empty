
-- Create a table to store logs if needed
CREATE TABLE IF NOT EXISTS log_table (
  id SERIAL PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Simple logging function
CREATE OR REPLACE FUNCTION log_message(message TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO log_table (message, created_at)
    VALUES (message, NOW());
EXCEPTION WHEN OTHERS THEN
    -- Suppress errors to prevent logging from breaking the main function
    RAISE NOTICE 'Error logging message: %', SQLERRM;
END;
$$;

-- Main function to update special goal values
CREATE OR REPLACE FUNCTION update_special_goal_values()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Enable logging for debugging
    PERFORM log_message('Starting update_special_goal_values function');

    -- Constants for sub-status IDs
    DECLARE
        SUBMISSION_STATUS_ID UUID := '71706ff4-1bab-4065-9692-2a1237629dda';
        ONBOARDING_STATUS_ID UUID := 'c9716374-3477-4606-877a-dfa5704e7680';
    BEGIN
        -- Process Submission and Onboarding goals
        WITH goal_instances AS (
            SELECT 
                g.id AS goal_id,
                g.name AS goal_name,
                ag.id AS assigned_goal_id,
                gi.id AS instance_id,
                gi.period_start,
                gi.period_end,
                gi.target_value,
                ag.employee_id,
                ag.goal_type
            FROM 
                hr_goals g
                JOIN hr_assigned_goals ag ON g.id = ag.goal_id
                JOIN hr_goal_instances gi ON ag.id = gi.assigned_goal_id
            WHERE 
                g.name IN ('Submission', 'Onboarding')
                AND gi.period_start <= CURRENT_DATE
                AND gi.period_end >= CURRENT_DATE
                AND ag.goal_type IN ('Daily', 'Weekly', 'Monthly', 'Yearly')
        ),
        goal_counts AS (
            SELECT
                gi.instance_id,
                gi.assigned_goal_id,
                gi.goal_name,
                gi.target_value,
                gi.period_end,
                COALESCE(SUM(scc.count), 0) AS current_value,
                CASE
                    WHEN COALESCE(SUM(scc.count), 0) >= gi.target_value THEN 'completed'
                    WHEN CURRENT_DATE > gi.period_end::date THEN 'overdue'
                    WHEN COALESCE(SUM(scc.count), 0) > 0 THEN 'in-progress'
                    ELSE 'pending'
                END AS status,
                CASE
                    WHEN gi.target_value > 0 THEN 
                        LEAST(ROUND((COALESCE(SUM(scc.count), 0)::numeric / gi.target_value) * 100), 100)
                    ELSE 0
                END AS progress
            FROM
                goal_instances gi
                LEFT JOIN hr_status_change_counts scc ON 
                    scc.candidate_owner = gi.employee_id
                    AND scc.sub_status_id = CASE 
                        WHEN gi.goal_name = 'Submission' THEN SUBMISSION_STATUS_ID 
                        ELSE ONBOARDING_STATUS_ID 
                    END
                    AND scc.created_at >= gi.period_start::timestamp
                    AND scc.created_at < (gi.period_end::date + INTERVAL '1 day')::timestamp
            GROUP BY
                gi.instance_id, gi.assigned_goal_id, gi.goal_name, gi.target_value, gi.period_end
        )
        UPDATE hr_goal_instances gi
        SET 
            current_value = gc.current_value,
            status = gc.status,
            progress = gc.progress,
            updated_at = NOW()
        FROM 
            goal_counts gc
        WHERE 
            gi.id = gc.instance_id
            AND (gi.current_value IS DISTINCT FROM gc.current_value 
                 OR gi.status IS DISTINCT FROM gc.status 
                 OR gi.progress IS DISTINCT FROM gc.progress);

        -- Log goal instance updates
        PERFORM log_message('Completed updating goal instances for Submission and Onboarding');

        -- Update hr_assigned_goals with aggregated values
        UPDATE hr_assigned_goals ag
        SET 
            current_value = subquery.total_current,
            progress = subquery.avg_progress,
            status = subquery.derived_status,
            updated_at = NOW()
        FROM (
            SELECT 
                gi.assigned_goal_id,
                SUM(gi.current_value) AS total_current,
                CASE
                    WHEN COUNT(gi.id) > 0 THEN ROUND(AVG(gi.progress))
                    ELSE 0
                END AS avg_progress,
                CASE
                    WHEN bool_and(gi.status = 'completed') THEN 'completed'
                    WHEN bool_or(gi.status = 'overdue') THEN 'overdue'
                    WHEN bool_or(gi.status = 'in-progress') THEN 'in-progress'
                    ELSE 'pending'
                END AS derived_status
            FROM 
                hr_goal_instances gi
            WHERE
                gi.assigned_goal_id IN (SELECT assigned_goal_id FROM goal_counts)
            GROUP BY 
                gi.assigned_goal_id
        ) AS subquery
        WHERE 
            ag.id = subquery.assigned_goal_id
            AND (ag.current_value IS DISTINCT FROM subquery.total_current
                 OR ag.progress IS DISTINCT FROM subquery.avg_progress
                 OR ag.status IS DISTINCT FROM subquery.derived_status);

        -- Log hr_assigned_goals updates
        PERFORM log_message('Completed updating assigned goals');
    
    EXCEPTION WHEN OTHERS THEN
        -- Log error
        PERFORM log_message('Error in update_special_goal_values: ' || SQLERRM);
        RAISE NOTICE 'Error in update_special_goal_values: %', SQLERRM;
    END;
END;
$$;

-- Function to update a specific goal by ID
CREATE OR REPLACE FUNCTION update_specific_special_goal(goal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    goal_name TEXT;
BEGIN
    -- Get the name of the goal
    SELECT name INTO goal_name FROM hr_goals WHERE id = goal_id;
    
    -- Only proceed if this is a special goal type
    IF goal_name NOT IN ('Submission', 'Onboarding') THEN
        RETURN FALSE;
    END IF;
    
    -- Run the update
    PERFORM update_special_goal_values();
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Trigger function to update goals when a new status change record is added
CREATE OR REPLACE FUNCTION trigger_update_special_goal_values()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Call the update_special_goal_values function
    PERFORM update_special_goal_values();
    RETURN NULL; -- Return NULL for AFTER triggers with FOR EACH STATEMENT
END;
$$;

-- Clean up any existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS status_change_update_goals ON hr_status_change_counts;

-- Create trigger to update goals on status changes
CREATE TRIGGER status_change_update_goals
AFTER INSERT OR UPDATE ON hr_status_change_counts
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_special_goal_values();

-- Schedule the function to run periodically using pg_cron
-- Uncomment this section if you've enabled pg_cron and want to set up a schedule
/*
-- Make sure pg_cron is installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every hour
SELECT cron.schedule(
   'update-special-goals-hourly',
   '0 * * * *',  -- Run at minute 0 of every hour (cron format)
   $$SELECT update_special_goal_values()$$
);
*/
