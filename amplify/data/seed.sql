CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  sort_order INT
);

INSERT INTO checklist_templates (category, title, description, sort_order) VALUES
('TWELVE_MONTHS', 'Determine Budget', 'Sit down and decide on a total budget for the wedding.', 1),
('TWELVE_MONTHS', 'Draft Guest List', 'Create an initial guest list to determine approximate head count.', 2),
('TWELVE_MONTHS', 'Book Venue', 'Tour venues and secure your date.', 3),
('SIX_MONTHS', 'Book Photographer', 'Find and secure your photographer and videographer.', 4),
('SIX_MONTHS', 'Buy Attire', 'Purchase wedding dress and suits.', 5),
('THREE_MONTHS', 'Send Invitations', 'Mail out physical or digital invitations with RSVP details.', 6),
('ONE_MONTH', 'Finalise Run Sheet', 'Share the final run sheet with all vendors.', 7),
('TWO_WEEKS', 'Finalise Seating Chart', 'Confirm table assignments and meal choices.', 8);

CREATE TABLE IF NOT EXISTS vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  icon VARCHAR(50)
);

INSERT INTO vendor_categories (name, icon) VALUES
('Venue', 'Building'),
('Catering', 'Utensils'),
('Photography', 'Camera'),
('Videography', 'Video'),
('Florist', 'Flower'),
('Music/Band', 'Music'),
('Attire', 'Shirt'),
('Hair & Makeup', 'Scissors'),
('Cake', 'Cake'),
('Transport', 'Car'),
('Stationery', 'Mail'),
('Planner', 'Calendar');
