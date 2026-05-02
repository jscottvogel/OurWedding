-- Seed data for Website FAQ Templates and Themes

-- 1. FAQ Templates
INSERT INTO "WebsiteFaq" (id, "weddingId", question, answer, category, "displayOrder", "isVisible") VALUES
('faq-template-1', 'system', 'Are kids welcome?', 'While we love your little ones, our wedding is going to be an adults-only event so that everyone can relax and enjoy the evening.', 'KIDS_PETS', 1, true),
('faq-template-2', 'system', 'Is there parking at the venue?', 'Yes, there is free parking available at the venue. You can leave your car overnight if needed, but please pick it up by 10 AM the next morning.', 'VENUE', 2, true),
('faq-template-3', 'system', 'When should I RSVP by?', 'Please RSVP by [Date] so we can finalize our headcount with the caterer.', 'GENERAL', 3, true);

-- 2. Dress Code Template
INSERT INTO "WebsiteFaq" (id, "weddingId", question, answer, category, "displayOrder", "isVisible") VALUES
('dress-code-template', 'system', 'What is the dress code?', 'The dress code is Cocktail Attire. Wear cocktail dresses, dressy jumpsuits, and dark jackets and slacks.', 'DRESS_CODE', 0, true);
