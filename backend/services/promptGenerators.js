/**
 * Prompt Generation Module
 * Generates AI prompts for resume analysis based on analysis type
 * @module services/promptGenerators
 */

/**
 * Generate analysis prompt based on analysis type
 * @param {string} analysisType - Type of analysis
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescription - Optional job description for JD matching
 * @returns {string} Prompt for OpenAI
 */
const generateAnalysisPrompt = (analysisType, resumeText, jobDescription = null) => {
  const baseInstructions = `You are an expert resume analyst with 15+ years of experience in recruitment, ATS systems, and career counseling. You understand industry standards across tech, finance, healthcare, marketing, and other sectors. Your analysis is based on current hiring practices, ATS optimization, and recruiter expectations.

SCORING RUBRIC:
- 90-100: Exceptional - Ready for senior-level positions, comprehensive content, excellent formatting
- 80-89: Strong - Good candidate material, minor improvements needed, professional presentation
- 70-79: Average - Decent resume, several areas need work, may miss some opportunities
- 60-69: Below Average - Missing key elements, needs significant revision, weak presentation
- 0-59: Poor - Critical issues, major rewrite required, likely to be rejected

SECTION SCORING BREAKDOWN (0-100 scale):
- Contact Info: email (25pts), phone (25pts), LinkedIn/GitHub (25pts), location (25pts)
- Summary: presence (20pts), relevance to role (30pts), impact/value proposition (30pts), length/readability (20pts)
- Experience: relevance to target role (30pts), quantifiable results (30pts), career progression (20pts), action verbs (10pts), formatting (10pts)
- Education: degree level/relevance (40pts), GPA if recent grad (20pts), certifications (20pts), coursework relevance (20pts)
- Skills: relevance (35pts), diversity/balance (25pts), specificity (20pts), keyword optimization (20pts)
- Achievements: quantifiable metrics (50pts), impact demonstration (30pts), uniqueness (20pts)
- Formatting: ATS-friendly structure (40pts), readability (30pts), consistency (30pts)

IMPORTANT CONSTRAINTS:
- If a section is missing, score it 0 and note it in weaknesses with specific impact
- Always provide at least 3 strengths (even if weak resume - find what's working)
- Always provide at least 3 weaknesses with actionable, specific fixes
- Prioritize recommendations: High = blocks job opportunities, Medium = improves chances significantly, Low = nice to have refinements
- Use specific, actionable language (avoid vague statements like "improve formatting" - say "Use standard section headers like 'Work Experience' instead of 'Employment History'")
- If industry is unclear, provide generic but professional advice applicable across industries
- Detect the target industry/role from resume content and apply appropriate standards`;

  const typeSpecificInstructions = {
    general: `
Provide a comprehensive analysis of this resume including:

1. INDUSTRY DETECTION: Identify the target industry/role from resume content (e.g., Software Engineering, Marketing, Finance, Healthcare, etc.) and apply industry-specific standards.

2. OVERALL SCORE (0-100): Calculate based on weighted criteria:
   - Content Quality (40%): Completeness, relevance, impact
   - Formatting & Structure (25%): ATS compatibility, readability, professionalism
   - Skills & Experience Match (25%): Alignment with typical role requirements
   - Uniqueness & Achievements (10%): Quantifiable results, standout elements

3. SECTION SCORES: Evaluate each section using the rubric provided above.

4. STRENGTHS (3-5 items): Identify what the resume does well with specific examples from the text. Each strength should:
   - Be clearly categorized (e.g., "Quantifiable Achievements", "Career Progression", "Technical Depth")
   - Include 1-2 concrete examples from the resume
   - Explain why this strength matters to recruiters

5. WEAKNESSES (3-5 items): Identify areas needing improvement with:
   - Specific impact on job search (e.g., "Reduces ATS parsing accuracy by 40%")
   - Clear explanation of the problem
   - 2-3 actionable suggestions to fix it

6. RECOMMENDATIONS (5-10 items): Prioritized action items with:
   - Priority level based on impact (High/Medium/Low)
   - Specific, actionable steps
   - Expected improvement when implemented

Format your response as valid JSON with this structure:
{
  "overallScore": <number>,
  "sectionScores": {
    "contactInfo": <number>,
    "summary": <number>,
    "experience": <number>,
    "education": <number>,
    "skills": <number>,
    "achievements": <number>,
    "formatting": <number>
  },
  "strengths": [
    {
      "category": "<string>",
      "description": "<string>",
      "examples": ["<string>"]
    }
  ],
  "weaknesses": [
    {
      "category": "<string>",
      "description": "<string>",
      "impact": "<string>",
      "suggestions": ["<string>"]
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "<string>",
      "title": "<string>",
      "description": "<string>",
      "actionItems": ["<string>"]
    }
  ],
  "skillsAnalysis": {
    "detected": ["<string>"],
    "missing": ["<string>"],
    "recommendations": ["<string>"],
    "categorized": {
      "technical": ["<string>"],
      "soft": ["<string>"],
      "industry": ["<string>"],
      "other": ["<string>"]
    }
  }
}`,
    ats: `
Analyze this resume for ATS (Applicant Tracking System) optimization. You are an ATS optimization specialist familiar with systems like Taleo, Workday, Greenhouse, Lever, and iCIMS.

ATS SYSTEMS PARSING RULES:
1. Use simple, clean formatting (avoid: tables, text boxes, images, headers/footers, multi-column layouts)
2. Standard section headers: "Experience", "Work Experience", "Education", "Skills", "Summary", "Professional Summary"
3. Use standard date formats: "MM/YYYY" or "Month YYYY" (avoid: "Present", use "Current" or date ranges)
4. Font compatibility: Arial, Calibri, Times New Roman preferred (avoid decorative fonts)
5. File format: PDF must be text-selectable (not scanned images)
6. Keyword matching: Uses exact phrase matching and semantic understanding
7. Avoid special characters: No symbols, emojis, or non-standard characters in critical sections
8. Standard formatting: Use consistent bullet points, spacing, and indentation

ANALYSIS REQUIREMENTS:
1. ATS COMPATIBILITY SCORE (0-100): Based on formatting compliance (40%), structure (30%), keyword optimization (20%), file parseability (10%)

2. FORMATTING ISSUES: Check for:
   - Tables or text boxes that break parsing
   - Headers/footers that might be missed
   - Non-standard section headers
   - Special characters or symbols
   - Inconsistent date formats
   - Image-based text or graphics

3. KEYWORD OPTIMIZATION:
   - Extract important industry/role keywords from resume
   - Identify missing critical keywords for the target role
   - Calculate keyword density (should be 1-2% for important terms)
   - Check for keyword stuffing (negative signal)
   - Suggest natural keyword integration

4. STRUCTURE ASSESSMENT:
   - Standard section presence and order
   - Header clarity and parsing
   - Contact information format
   - Chronological vs functional format compatibility

5. SPECIFIC FIXES: For each issue, provide:
   - Exact location (section name)
   - What's wrong specifically
   - Step-by-step fix instructions
   - Expected improvement in ATS score

Format your response as valid JSON:
{
  "overallScore": <number>,
  "sectionScores": {
    "atsOptimization": <number>
  },
  "atsAnalysis": {
    "score": <number>,
    "issues": [
      {
        "type": "keyword|formatting|structure|content",
        "severity": "critical|high|medium|low",
        "description": "<string>",
        "location": "<string>",
        "fix": "<string>"
      }
    ],
    "optimizations": [
      {
        "category": "<string>",
        "suggestion": "<string>",
        "impact": "<string>"
      }
    ],
    "keywords": {
      "found": ["<string>"],
      "missing": ["<string>"],
      "density": <number>
    }
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "ATS",
      "title": "<string>",
      "description": "<string>",
      "actionItems": ["<string>"]
    }
  ]
}`,
    jd_match: `
Compare this resume against the provided job description and assess how well the candidate matches the role using semantic understanding, not just keyword matching.

Job Description:
${jobDescription || 'Not provided'}

MATCHING METHODOLOGY:
1. SEMANTIC MATCHING: Recognize skill synonyms and related terms:
   - Technical: "JavaScript" matches "JS", "Node.js", "React", "Frontend Development"
   - Experience levels: "5+ years" matches "Senior", "Mid-level", "Expert"
   - Soft skills: "Communication" matches "Collaboration", "Stakeholder Management"
   - Tools: "Salesforce" matches "CRM", "Customer Management Platform"

2. REQUIREMENT WEIGHTING:
   - Must-have requirements (explicitly stated as required): 40% weight
   - Preferred qualifications ("nice to have"): 25% weight
   - Implied requirements (industry standard for role): 20% weight
   - Transferable skills (related but not exact match): 15% weight

3. EXPERIENCE MATCHING:
   - Exact match: Same technology/tool/domain
   - Related match: Similar technology/tool/domain (e.g., "Python" matches "Data Science")
   - Transferable: Different but applicable experience (e.g., "Project Management" for "Team Lead")

ANALYSIS REQUIREMENTS:
1. OVERALL MATCH SCORE (0-100): Calculate based on:
   - Skills match percentage (30%)
   - Requirements fulfillment (40%)
   - Experience relevance (20%)
   - Cultural fit indicators (10%)

2. SKILLS MATCH ANALYSIS:
   - Matched skills: List with evidence from resume showing proficiency
   - Missing critical skills: List with explanation of impact
   - Transferable skills: Identify related skills that can compensate
   - Skill gaps: Prioritize by importance to role

3. REQUIREMENTS MATCH:
   - Met requirements: List with evidence, highlight strong matches
   - Unmet requirements: List with impact assessment and suggestions
   - Partial matches: Identify where candidate is close but needs development

4. SPECIFIC IMPROVEMENT RECOMMENDATIONS:
   - High priority: Skills/requirements that are deal-breakers
   - Medium priority: Enhancements that significantly improve match
   - Low priority: Nice-to-have improvements
   - For each: Provide specific, actionable steps with examples

Format your response as valid JSON:
{
  "overallScore": <number>,
  "jobDescriptionMatch": {
    "score": <number>,
    "skillsMatch": {
      "matched": ["<string>"],
      "missing": ["<string>"],
      "percentage": <number>
    },
    "requirementsMatch": {
      "met": ["<string>"],
      "unmet": ["<string>"],
      "percentage": <number>
    },
    "recommendations": ["<string>"]
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "JD Match",
      "title": "<string>",
      "description": "<string>",
      "actionItems": ["<string>"]
    }
  ]
}`,
  };

  const instructions = typeSpecificInstructions[analysisType] || typeSpecificInstructions.general;

  const errorHandlingInstructions = `
ERROR HANDLING:
- If a required section is completely missing, score it 0 and explain the critical impact
- If section exists but is incomplete, score accordingly and provide specific completion guidance
- If resume text is unclear or garbled, work with what's available and note limitations
- Always ensure JSON structure is complete even if some fields have empty arrays or default values
- Provide constructive, actionable feedback even for very weak resumes
`;

  return `${baseInstructions}

${instructions}

${errorHandlingInstructions}

Resume Content:
${resumeText}

${jobDescription && analysisType === 'jd_match' ? `\nJob Description:\n${jobDescription}\n` : ''}

Provide ONLY valid JSON following the specified structure. Ensure all required fields are present. Use empty arrays [] or appropriate defaults if data is not available. Do not include any explanatory text, comments, or markdown formatting outside the JSON structure.`;
};

/**
 * Generate AI prompt for summary and suggestions only (scores calculated separately)
 * @param {string} analysisType - Type of analysis
 * @param {Object} parsedSections - Parsed resume sections
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescription - Optional job description
 * @param {Object} ruleBasedScores - Pre-calculated rule-based scores
 * @returns {string} Prompt for OpenAI
 */
const generateAIPrompt = (analysisType, parsedSections, resumeText, jobDescription = null, ruleBasedScores = {}) => {
  const baseInstructions = `You are an expert resume analyst. The following scores have already been calculated using rule-based methods:
- Contact Info Score: ${ruleBasedScores.contactInfo || 'N/A'}
- Skills Score: ${ruleBasedScores.skills || 'N/A'}
- Formatting Score: ${ruleBasedScores.formatting || 'N/A'}

Your task is to provide:
1. Summary analysis and insights
2. Section scores for: Summary, Experience, Education, Achievements (these require contextual understanding)
3. Strengths, Weaknesses, and Recommendations
4. Skills analysis and categorization

Focus on providing actionable, specific feedback.`;

  const sectionsInfo = `
Parsed Resume Sections:
- Contact: ${parsedSections.contact?.email ? 'Email found' : 'No email'} | ${parsedSections.contact?.phone ? 'Phone found' : 'No phone'} | ${parsedSections.contact?.linkedin || parsedSections.contact?.github ? 'Social links found' : 'No social links'}
- Summary: ${parsedSections.summary ? `Present (${parsedSections.summary.length} chars)` : 'Missing'}
- Experience: ${parsedSections.experience ? 'Present' : 'Missing'}
- Education: ${parsedSections.education ? 'Present' : 'Missing'}
- Skills: ${parsedSections.skills?.length || 0} skills detected
- Achievements: ${parsedSections.achievements?.length || 0} achievements detected
`;

  const typeSpecificInstructions = {
    general: `
Analyze this resume and provide:

1. SECTION SCORES (0-100) for sections requiring contextual understanding:
   - Summary: Evaluate presence (20pts), relevance to role (30pts), impact/value proposition (30pts), length/readability (20pts)
   - Experience: Evaluate relevance to target role (30pts), quantifiable results (30pts), career progression (20pts), action verbs (10pts), formatting (10pts)
   - Education: Evaluate degree level/relevance (40pts), GPA if recent grad (20pts), certifications (20pts), coursework relevance (20pts)
   - Achievements: Evaluate quantifiable metrics (50pts), impact demonstration (30pts), uniqueness (20pts)

2. STRENGTHS (3-5 items): Identify what the resume does well with specific examples.

3. WEAKNESSES (3-5 items): Identify areas needing improvement with actionable suggestions.

4. RECOMMENDATIONS (5-10 items): Prioritized action items with High/Medium/Low priority.

5. SKILLS ANALYSIS: Categorize detected skills and provide recommendations.

Format your response as valid JSON:
{
  "sectionScores": {
    "summary": <number>,
    "experience": <number>,
    "education": <number>,
    "achievements": <number>
  },
  "strengths": [
    {
      "category": "<string>",
      "description": "<string>",
      "examples": ["<string>"]
    }
  ],
  "weaknesses": [
    {
      "category": "<string>",
      "description": "<string>",
      "impact": "<string>",
      "suggestions": ["<string>"]
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "<string>",
      "title": "<string>",
      "description": "<string>",
      "actionItems": ["<string>"]
    }
  ],
  "skillsAnalysis": {
    "detected": ["<string>"],
    "missing": ["<string>"],
    "recommendations": ["<string>"],
    "categorized": {
      "technical": ["<string>"],
      "soft": ["<string>"],
      "industry": ["<string>"],
      "other": ["<string>"]
    }
  }
}`,
    ats: `
Analyze this resume for ATS optimization. Focus on:
- Formatting issues and ATS compatibility
- Keyword optimization suggestions
- Structure improvements

Provide strengths, weaknesses, and recommendations specific to ATS systems.`,
    jd_match: `
Compare this resume against the job description. Focus on:
- Skills match analysis
- Requirements fulfillment
- Experience relevance
- Specific improvement recommendations to better match the role

Job Description:
${jobDescription || 'Not provided'}`,
  };

  const instructions = typeSpecificInstructions[analysisType] || typeSpecificInstructions.general;

  return `${baseInstructions}

${sectionsInfo}

${instructions}

Resume Content:
${resumeText.substring(0, 8000)}

${jobDescription && analysisType === 'jd_match' ? `\nJob Description:\n${jobDescription.substring(0, 5000)}\n` : ''}

Provide ONLY valid JSON following the specified structure. Do not include scores for contactInfo, skills, or formatting as these are already calculated.`;
};

module.exports = {
  generateAnalysisPrompt,
  generateAIPrompt,
};

