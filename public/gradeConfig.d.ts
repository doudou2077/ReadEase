export const GRADE_LEVELS: {
    readonly COLLEGE_GRADUATE: "College Graduate";
    readonly COLLEGE: "College";
    readonly HIGH_SCHOOL: "High School";
    readonly MIDDLE_SCHOOL: "Middle School";
    readonly ELEMENTARY: "Elementary School";
    readonly BELOW_KINDERGARTEN: "Below Kindergarten";
};

export const SIMPLIFICATION_PROMPTS: {
    readonly [K in typeof GRADE_LEVELS[keyof typeof GRADE_LEVELS]]: string;
};