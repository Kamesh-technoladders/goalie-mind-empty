import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../integrations/supabase/client'; // Adjust import path as needed
import { v4 as uuidv4 } from 'uuid';

function ResumeAnalysisModal({ jobId, onClose, setError, onAnalysisComplete = () => {}, initialData }) {
  const [resumeText, setResumeText] = useState(initialData?.resume_text || '');
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(initialData || null);
  const [updatedSkills, setUpdatedSkills] = useState(initialData?.matched_skills || []);
  const [candidateId, setCandidateId] = useState(initialData?.candidate_id || null);
  const [candidateName, setCandidateName] = useState(initialData?.candidate_name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [github, setGithub] = useState(initialData?.github || '');
  const [linkedin, setLinkedin] = useState(initialData?.linkedin || '');
  const [isRevalidated, setIsRevalidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);

  // Gemini setup
  const geminiApiKey = 'AIzaSyDAgL2A2e6mAmQ9hUhWGxkmRmTdOG2LDB4';
  const geminiModel = 'gemini-1.5-pro';
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: geminiModel });

  useEffect(() => {
    const getJobDescription = async () => {
      if (!jobId) {
        setError('Please select a job first.');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('hr_jobs')
          .select('description')
          .eq('id', jobId)
          .single();
        if (error) throw error;
        if (!data?.description) throw new Error('Job description not found.');
        setJobDescription(data.description);
      } catch (err) {
        setError('Error loading job description: ' + err.message);
      }
    };
    getJobDescription();
  }, [jobId, setError]);

  const cleanResponse = (text) => {
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error('No valid JSON found in response');
    return jsonMatch[0];
  };

  const analyzeResume = async () => {
    if (!jobDescription || !resumeText) {
      setError('Please provide both job description and resume.');
      return;
    }

    setIsLoading(true);
    const newCandidateId = candidateId || uuidv4();
    setCandidateId(newCandidateId);

    try {
      const prompt = `
        Analyze this resume against the job description and return ONLY a valid JSON response with:
        - overall_match_score (percentage, 0-100)
        - matched_skills (array of objects with:
            requirement (string, detailed, e.g., "Python for automation"),
            matched ('yes', 'partial', 'no'),
            details (string, specific evidence from resume or "Not mentioned" if absent))
        - summary (string, short plain text summary)
        - companies (array of company names found in the resume)
        - missing_or_weak_areas (array of strings listing gaps)
        - top_skills (array of candidate's strongest skills)
        - development_gaps (array of skills needing improvement)
        - additional_certifications (array of strings listing certifications not required by JD)
        - section_wise_scoring (object with main sections, each containing submenus:
            {
              section (string),
              weightage (number, percentage),
              submenus (array of { submenu (string), weightage (number, percentage of section), score (number, 0-10), weighted_score (number, calculated), remarks (string) })
            })
        - candidate_name (string, extracted from resume or "Unknown" if not found)
        - email (string, extracted from resume or "" if not found)
        - github (string, extracted from resume or "" if not found)
        - linkedin (string, extracted from resume or "" if not found)

        Job Description: ${jobDescription}
        Resume: ${resumeText}

        Structure section_wise_scoring:
        - Technical Skills (weightage: 40%, submenus: Core Skills 60%, Tools 40%)
        - Work Experience (weightage: 30%, submenus: Relevant Experience 70%, Duration 30%)
        - Projects (weightage: 15%, submenus: Personal Projects 50%, Professional Projects 50%)
        - Education (weightage: 10%, submenus: Degree 50%, Certifications 50%)
        - Achievements (weightage: 5%, submenus: Awards 50%, Recognitions 50%)
        - Soft Skills (weightage: 5%, submenus: Leadership 50%, Communication 50%)

        Scoring Guidelines:
        - 'yes' (8-10/10): Clear, direct evidence of the skill/experience matching JD requirement.
        - 'partial' (4-7/10): Indirect or limited evidence (e.g., related skill or short duration).
        - 'no' (0-3/10): No evidence found.
        - Infer skills from context (e.g., "Developed automation scripts" implies scripting skills).
        - For Duration: Score based on years of experience relative to JD (e.g., 5+ years = 10, 2-4 years = 5, <2 years = 0).
        - Calculate weighted_score = (submenu.weightage * score) / 100 for each submenu.
        - Calculate section score = sum of submenu weighted_scores.
        - Calculate overall_match_score = sum(section.weightage * section_score) / 100.

        Use symbols in remarks: ✅ for 'yes', ⚠️ for 'partial', ❌ for 'no'. Return ONLY the JSON object.
      `;

      const result = await model.generateContent(prompt);
      const cleanedText = cleanResponse(result.response.text());
      const parsedResult = JSON.parse(cleanedText);

      // Validate parsed result structure
      if (!parsedResult.overall_match_score || !parsedResult.section_wise_scoring) {
        throw new Error('Invalid analysis result structure');
      }

      setAnalysisResult(parsedResult);
      setUpdatedSkills(parsedResult.matched_skills || []);
      setCandidateName(parsedResult.candidate_name || 'Unknown');
      setEmail(parsedResult.email || '');
      setGithub(parsedResult.github || '');
      setLinkedin(parsedResult.linkedin || '');

      const saved = await saveData(resumeText, parsedResult, newCandidateId, true);
      if (saved) {
        onAnalysisComplete({
          job_id: jobId,
          candidate_id: newCandidateId,
          candidate_name: parsedResult.candidate_name,
          overall_score: parsedResult.overall_match_score,
        });
        setIsAnalysisComplete(true);
      }
      setShowResults(false); // Ensure results are hidden until user clicks "View Results"
    } catch (err) {
      setError('Error analyzing resume: ' + err.message);
      console.error('Analysis Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (resumeText, result, candidateId, isInitial = false) => {
    try {
      if (isInitial && result.email) {
        const { data: existing } = await supabase
          .from('resume_analysis')
          .select('candidate_id')
          .eq('email', result.email)
          .single();
        if (existing) {
          setError('Candidate with this email already exists.');
          return false;
        }
      }

      const payload = {
        job_id: jobId,
        candidate_id: candidateId,
        resume_text: resumeText || '',
        overall_score: Math.round(result.overall_match_score),
        matched_skills: result.matched_skills || [],
        summary: result.summary || '',
        companies: result.companies || [],
        missing_or_weak_areas: result.missing_or_weak_areas || [],
        top_skills: result.top_skills || [],
        development_gaps: result.development_gaps || [],
        additional_certifications: result.additional_certifications || [],
        section_wise_scoring: result.section_wise_scoring || {},
        candidate_name: result.candidate_name || 'Unknown',
        email: result.email || '',
        github: result.github || '',
        linkedin: result.linkedin || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('resume_analysis')
        .upsert(payload, { onConflict: ['job_id', 'candidate_id'] });

      if (error) throw error;
      return true;
    } catch (err) {
      setError('Error saving data: ' + err.message);
      console.error('Save Error:', err);
      return false;
    }
  };

  const updateSkillLocally = (index, newStatus) => {
    const newSkills = [...updatedSkills];
    newSkills[index].matched = newStatus;
    setUpdatedSkills(newSkills);
  };

  const revalidateSkills = async () => {
    setIsLoading(true);
    try {
      const prompt = `
        Recalculate scores based ONLY on the updated skills and initial section-wise scoring. Do NOT re-analyze the resume or job description. Return ONLY a valid JSON response with:
        - overall_match_score (percentage, 0-100)
        - section_wise_scoring (object with main sections, each containing submenus:
            {
              section (string),
              weightage (number, percentage),
              submenus (array of { submenu (string), weightage (number, percentage of section), score (number, 0-10), weighted_score (number, calculated), remarks (string) })
            })

        Updated Skills: ${JSON.stringify(updatedSkills)}
        Initial Section-wise Scoring: ${JSON.stringify(analysisResult.section_wise_scoring)}

        Structure section_wise_scoring:
        - Technical Skills (weightage: 40%, submenus: Core Skills 60%, Tools 40%)
        - Work Experience (weightage: 30%, submenus: Relevant Experience 70%, Duration 30%)
        - Projects (weightage: 15%, submenus: Personal Projects 50%, Professional Projects 50%)
        - Education (weightage: 10%, submenus: Degree 50%, Certifications 50%)
        - Achievements (weightage: 5%, submenus: Awards 50%, Recognitions 50%)
        - Soft Skills (weightage: 5%, submenus: Leadership 50%, Communication 50%)

        Skill-to-Submenu Mapping:
        - Core Skills: Technical skills like "Python for automation", "Java programming", etc.
        - Tools: Tool-specific skills like "Familiarity with Jenkins", "Knowledge on containerization", etc.
        - Relevant Experience: Experience-related skills like "RPA Automation experience", etc.
        - Duration: Duration-related evidence (infer from updated skills context if applicable).
        - Personal Projects: Project-related skills from personal work.
        - Professional Projects: Project-related skills from professional work.
        - Degree: Education-related skills or qualifications.
        - Certifications: Certification-related skills.
        - Awards: Achievement-related skills or recognitions.
        - Recognitions: Other recognition-related skills.
        - Leadership: Leadership-related skills.
        - Communication: Communication-related skills.

        Scoring Rules:
        - 'yes' = 10
        - 'partial' = 5
        - 'no' = 0

        Instructions:
        - Start with the initial section_wise_scoring.
        - Update submenus based on updated skills:
          - For each submenu, calculate the new score as the average of mapped skills' scores (10 for 'yes', 5 for 'partial', 0 for 'no').
          - If no skills map to a submenu, retain its initial score and remarks.
        - Calculate weighted_score = (submenu.weightage * score) / 100.
        - Calculate section_score = sum(submenu weighted_scores).
        - Calculate overall_match_score = sum(section.weightage * section_score) / 100.
        - Use symbols in remarks: ✅ for 'yes', ⚠️ for 'partial', ❌ for 'no'.

        Return ONLY the JSON object.
      `;

      const result = await model.generateContent(prompt);
      const cleanedText = cleanResponse(result.response.text());
      const updatedScores = JSON.parse(cleanedText);

      const updatedResult = {
        ...analysisResult,
        overall_match_score: Math.round(updatedScores.overall_match_score),
        section_wise_scoring: updatedScores.section_wise_scoring,
        matched_skills: updatedSkills,
      };

      setAnalysisResult(updatedResult);
      setIsRevalidated(true);

      const saved = await saveData(resumeText, updatedResult, candidateId, false);
      if (saved) {
        onAnalysisComplete({
          job_id: jobId,
          candidate_id: candidateId,
          candidate_name: candidateName,
          overall_score: updatedResult.overall_match_score,
        });
      }
      setShowResults(false); // Keep results hidden until user clicks "View Results"
    } catch (err) {
      setError('Error re-evaluating scores: ' + err.message);
      console.error('Revalidation Error:', err);

      // Fallback local revalidation
      const updatedScoring = JSON.parse(JSON.stringify(analysisResult.section_wise_scoring));
      const skillMap = {
        'Core Skills': updatedSkills.filter(s => s.requirement.toLowerCase().includes('for') || s.requirement.toLowerCase().includes('programming')),
        'Tools': updatedSkills.filter(s => s.requirement.toLowerCase().includes('familiarity') || s.requirement.toLowerCase().includes('knowledge')),
        'Relevant Experience': updatedSkills.filter(s => s.requirement.toLowerCase().includes('experience')),
        'Duration': updatedSkills.filter(s => s.requirement.toLowerCase().includes('experience')),
        'Personal Projects': updatedSkills.filter(s => s.requirement.toLowerCase().includes('project')),
        'Professional Projects': updatedSkills.filter(s => s.requirement.toLowerCase().includes('project')),
        'Degree': updatedSkills.filter(s => s.requirement.toLowerCase().includes('degree')),
        'Certifications': updatedSkills.filter(s => s.requirement.toLowerCase().includes('certification')),
        'Awards': updatedSkills.filter(s => s.requirement.toLowerCase().includes('award')),
        'Recognitions': updatedSkills.filter(s => s.requirement.toLowerCase().includes('recognition')),
        'Leadership': updatedSkills.filter(s => s.requirement.toLowerCase().includes('leadership')),
        'Communication': updatedSkills.filter(s => s.requirement.toLowerCase().includes('communication')),
      };

      Object.entries(updatedScoring).forEach(([sectionName, section]) => {
        section.submenus.forEach(submenu => {
          const mappedSkills = skillMap[submenu.submenu] || [];
          if (mappedSkills.length > 0) {
            const avgScore = mappedSkills.reduce((sum, skill) => {
              return sum + (skill.matched === 'yes' ? 10 : skill.matched === 'partial' ? 5 : 0);
            }, 0) / mappedSkills.length;
            submenu.score = Math.round(avgScore);
            submenu.weighted_score = (submenu.weightage * submenu.score) / 100;
            submenu.remarks = mappedSkills.map(s => `${s.requirement}: ${s.matched === 'yes' ? '✅' : s.matched === 'partial' ? '⚠️' : '❌'}`).join(', ');
          }
        });
      });

      const overallMatchScore = Object.values(updatedScoring).reduce((total, section) => {
        const sectionScore = section.submenus.reduce((sum, submenu) => sum + submenu.weighted_score, 0);
        return total + (sectionScore * section.weightage) / 100;
      }, 0);

      const updatedResultFallback = {
        ...analysisResult,
        overall_match_score: Math.round(overallMatchScore),
        section_wise_scoring: updatedScoring,
        matched_skills: updatedSkills,
      };

      setAnalysisResult(updatedResultFallback);
      setIsRevalidated(true);
      const saved = await saveData(resumeText, updatedResultFallback, candidateId, false);
      if (saved) {
        onAnalysisComplete({
          job_id: jobId,
          candidate_id: candidateId,
          candidate_name: candidateName,
          overall_score: updatedResultFallback.overall_match_score,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      style={{
        content: {
          maxWidth: '1000px',
          width: '95%',
          margin: '20px auto',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #d1c4e9',
          background: '#fff',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <h2 className="text-2xl font-bold text-purple-800 mb-4">Resume Analysis</h2>
      <textarea
        placeholder="Paste your resume here..."
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        rows={8}
        className="w-full p-3 border border-purple-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <div className="flex space-x-4 mb-4">
        <button
          onClick={analyzeResume}
          disabled={isLoading || !resumeText || !jobDescription}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
            isLoading || !resumeText || !jobDescription
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
          }`}
        >
          {isLoading ? 'Loading...' : 'Analyze'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Close
        </button>
      </div>
      {/* {isLoading && <p className="text-purple-600">Loading...</p>} */}
      { isAnalysisComplete && analysisResult && resumeText && (
        <div className="mt-4">
          <button
            onClick={() => setShowResults(!showResults)}
            className="px-4 py-2 rounded-lg bg-purple-200 text-purple-800 font-semibold hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {showResults ? 'Hide Results' : '👁️ View Results'}
          </button>
          {showResults && analysisResult && !isLoading && (
            <>
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-purple-800 mb-2">Candidate: {candidateName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 bg-purple-50 p-4 rounded-lg border border-purple-200 text-purple-600">
                  <p><strong>Email:</strong> {email || 'N/A'}</p>
                  <p><strong>GitHub:</strong> {github || 'N/A'}</p>
                  <p><strong>LinkedIn:</strong> {linkedin || 'N/A'}</p>
                </div>
                <h3 className="text-xl font-semibold text-purple-800 mb-2">
                  ✅ Overall Match Score: {analysisResult.overall_match_score}%
                </h3>
              </div>
              <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">🧾 Summary</h4>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-purple-600">
                {analysisResult.summary || 'No summary available'}
              </div>

            <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">🔑 Matched Skills & Experiences</h4>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left border-collapse">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Requirement</th>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Status</th>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Details</th>
                      {!isRevalidated && <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Update</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(updatedSkills) && updatedSkills.length > 0 ? (
                      updatedSkills.map((skill, idx) => (
                        <tr key={idx} className="hover:bg-purple-50 transition-colors">
                          <td className="p-3 text-purple-700 border-b border-purple-100">{skill.requirement}</td>
                          <td className="p-3 text-purple-700 border-b border-purple-100 text-center">
                            {skill.matched === 'yes' ? '✅ Yes' : skill.matched === 'partial' ? '⚠️ Partial' : '❌ No'}
                          </td>
                          <td className="p-3 text-purple-600 border-b border-purple-100">{skill.details}</td>
                          {!isRevalidated && (
                            <td className="p-3 border-b border-purple-100">
                              <select
                                value={skill.matched || ''}
                                onChange={(e) => updateSkillLocally(idx, e.target.value)}
                                className="w-full p-1 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                              >
                                <option value="" disabled>Choose</option>
                                <option value="no">No</option>
                                <option value="partial">Partial</option>
                                <option value="yes">Full</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isRevalidated ? 3 : 4} className="p-3 text-purple-600 text-center border-b border-purple-100">
                          No skills data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">⚠️ Missing or Weak Areas</h4>
              <ul className="list-disc pl-5 text-purple-600">
                {Array.isArray(analysisResult.missing_or_weak_areas) && analysisResult.missing_or_weak_areas.length > 0
                  ? analysisResult.missing_or_weak_areas.map((area, idx) => <li key={idx} className="mb-2">{area}</li>)
                  : <li>No data</li>}
              </ul>

              <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">🏷️ Top Skills</h4>
              <ul className="list-disc pl-5 text-purple-600">
                {Array.isArray(analysisResult.top_skills) && analysisResult.top_skills.length > 0
                  ? analysisResult.top_skills.map((skill, idx) => <li key={idx} className="mb-2">{skill}</li>)
                  : <li>No data</li>}
              </ul>

              <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">📜 Additional Certifications (Not Required by JD)</h4>
              {Array.isArray(analysisResult.additional_certifications) && analysisResult.additional_certifications.length > 0 ? (
                <ul className="list-disc pl-5 text-purple-600">
                  {analysisResult.additional_certifications.map((cert, idx) => <li key={idx} className="mb-2">{cert}</li>)}
                </ul>
              ) : (
                <p className="text-purple-600">None listed</p>
              )}

              <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">⚠️ Development Gaps</h4>
              <ul className="list-disc pl-5 text-purple-600">
                {Array.isArray(analysisResult.development_gaps) && analysisResult.development_gaps.length > 0
                  ? analysisResult.development_gaps.map((gap, idx) => <li key={idx} className="mb-2">{gap}</li>)
                  : <li>No data</li>}
              </ul>

              <h4 className="text-lg font-semibold text-purple-800 mt-6 mb-4">📊 Section-wise Scoring Rubric</h4>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Section</th>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Weightage</th>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Submenu</th>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Score</th>
                      <th className="p-3 text-purple-800 font-semibold border-b-2 border-purple-200">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.section_wise_scoring && Object.keys(analysisResult.section_wise_scoring).length > 0 ? (
                      Object.values(analysisResult.section_wise_scoring).flatMap((section, sectionIdx) =>
                        section.submenus.map((submenu, submenuIdx) => (
                          <tr key={`${sectionIdx}-${submenuIdx}`} className="hover:bg-purple-50 transition-colors">
                            {submenuIdx === 0 && (
                              <td
                                className="p-3 text-purple-700 border-b border-purple-100 align-top"
                                rowSpan={section.submenus.length}
                              >
                                {section.section}
                              </td>
                            )}
                            {submenuIdx === 0 && (
                              <td
                                className="p-3 text-purple-700 border-b border-purple-100 align-top"
                                rowSpan={section.submenus.length}
                              >
                                {section.weightage}%
                              </td>
                            )}
                            <td className="p-3 text-purple-700 border-b border-purple-100">{submenu.submenu} ({submenu.weightage}%)</td>
                            <td className="p-3 text-purple-700 border-b border-purple-100 text-center">{submenu.score}</td>
                            <td className="p-3 text-purple-600 border-b border-purple-100">{submenu.remarks}</td>
                          </tr>
                        ))
                      )
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-purple-600 text-center border-b border-purple-100">
                          No scoring data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

             

              {!isRevalidated && (
                <button
                  onClick={revalidateSkills}
                  disabled={isLoading}
                  className={`mt-4 px-4 py-2 rounded-lg bg-purple text-white font-semibold transition-colors ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  }`}
                >
                  {isLoading ? 'Loading...' : 'Revalidate'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

export default ResumeAnalysisModal;