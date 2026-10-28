const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "WeddingSteward-Website-Antigravity-Prompts-v1.0_1.docx"})
    .then(function(result){
        fs.writeFileSync("prompts.md", result.value);
        console.log("Successfully wrote to prompts.md");
    })
    .catch(function(error) {
        console.error(error);
    });
