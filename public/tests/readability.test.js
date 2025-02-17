import textReadability from 'text-readability';

function getReadingLevelDescription(gradeLevel) {
    if (gradeLevel < 0) return "Below Kindergarten";
    if (gradeLevel <= 5) return "Elementary School";
    if (gradeLevel <= 8) return "Middle School";
    if (gradeLevel <= 12) return "High School";
    if (gradeLevel <= 16) return "College";
    return "College Graduate";
}

const testSamples = [
    {
        text: "The cat sat on the mat.",
        expected: "Below Kindergarten" // -1.5 is below kindergarten
    },
    {
        text: "The mitochondria is the powerhouse of the cell.",
        expected: "High School"  // 8.8 is late middle school/early high school
    },
    {
        text: "Quantum entanglement demonstrates non-local correlation between particles.",
        expected: "College Graduate" // 22.5 is well above college level
    }
];

// Add overall timing for all tests
console.time('Total Test Duration');

// Run tests and log results
testSamples.forEach((sample, index) => {
    console.time(`Test ${index + 1} Duration`);

    const gradeLevel = textReadability.fleschKincaidGrade(sample.text);

    console.timeEnd(`Test ${index + 1} Duration`);

    console.log({
        text: sample.text,
        gradeLevel: gradeLevel,
        readingLevel: getReadingLevelDescription(gradeLevel),
        expectedLevel: sample.expected,
    });
});

console.timeEnd('Total Test Duration');