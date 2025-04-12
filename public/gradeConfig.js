export const GRADE_LEVELS = {
    COLLEGE_GRADUATE: "College Graduate (17+)",
    COLLEGE: "College (13-16)",
    HIGH_SCHOOL: "High School (9-12)",
    MIDDLE_SCHOOL: "Middle School (6-8)",
    ELEMENTARY: "Elementary (1-5)",
    BELOW_KINDERGARTEN: "Kindergarten (K)"
};


export const SIMPLIFICATION_PROMPTS = {
    [GRADE_LEVELS.COLLEGE_GRADUATE]: `Using Flesch-Kincaid Grade Level standard, simplify this graduate-level text to college level by:
- Replace specialized academic terminology with more general academic terms
- Break down complex theoretical concepts into clearer explanations
- Simplify compound-complex sentences into shorter ones
- Remove excessive citations and technical details
- Keep key academic concepts but explain them more directly
- Keep text length within 20% of original length

Text to simplify: {{text}}

Return in exactly this format:
"Original Grade Level: Graduate (17+)
Simplified text: [your simplified text]
Current Grade Level: College (13-16). Remaining simplification levels: 4"`,

    [GRADE_LEVELS.COLLEGE]: `Using Flesch-Kincaid Grade Level standard, simplify this college-level text to high school level by:
- Replace advanced vocabulary with common alternatives
- Convert abstract concepts to concrete examples
- Use more straightforward sentence structures
- Add context for complex ideas
- Remove specialized academic language
- Keep text length within 25% of original length

Text to simplify: {{text}}

Return in exactly this format:
"Original Grade Level: College (13-16)
Simplified text: [your simplified text]
Current Grade Level: High School (9-12). Remaining simplification levels: 3"`,

    [GRADE_LEVELS.HIGH_SCHOOL]: `Using Flesch-Kincaid Grade Level standard, simplify this high school-level text to middle school level by:
- Break down complex sentences into simpler ones
- Replace metaphors and idioms with direct statements
- Add brief explanations for potentially unfamiliar terms
- Use active voice instead of passive voice
- Provide examples for abstract concepts
- Keep text length within 30% of original length

Text to simplify: {{text}}

Return in exactly this format:
"Original Grade Level: High School (9-12)
Simplified text: [your simplified text]
Current Grade Level: Middle School (6-8). Remaining simplification levels: 2"`,

    [GRADE_LEVELS.MIDDLE_SCHOOL]: `Using Flesch-Kincaid Grade Level standard, simplify this middle school-level text to elementary level by:
- Use simple subject-verb-object sentence structures
- Break long sentences into multiple shorter ones
- Use common, everyday vocabulary
- Remove complex clauses
- Use concrete rather than abstract terms
- Keep text length within 35% of original length

Text to simplify: {{text}}

Return in exactly this format:
"Original Grade Level: Middle School (6-8)
Simplified text: [your simplified text]
Current Grade Level: Elementary (1-5). Remaining simplification levels: 1"`,

    [GRADE_LEVELS.ELEMENTARY]: `Using Flesch-Kincaid Grade Level standard, simplify this elementary-level text to kindergarten level by:
- Use basic vocabulary only
- Create very short, simple sentences
- Present one idea per sentence
- Use repetition for important points
- Remove any complex concepts
- Keep text length within 40% of original length

Text to simplify: {{text}}

Return in exactly this format:
"Original Grade Level: Elementary (1-5)
Simplified text: [your simplified text]
Current Grade Level: Kindergarten (K). Remaining simplification levels: 0"`
};