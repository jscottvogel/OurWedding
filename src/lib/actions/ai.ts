'use server';

// In a full implementation, this would use the AWS SDK to invoke Amazon Bedrock
// and process the response stream. For this MVP, we mock the responses.

const RESPONSES: Record<string, string> = {
  budget: "Based on the standard 100-guest wedding in your area, I suggest allocating $5,000 for catering, $2,000 for photography, and $1,500 for the venue deposit. Would you like me to add these to your Budget Tracker?",
  timeline: "A typical evening reception runs for 4 hours. You should plan for a 6:00 PM cocktail hour, 7:00 PM dinner service, and 8:30 PM first dance. I can add these milestones to your Run Sheet.",
  vendor: "When booking a florist, always ask if vase rentals are included in the quote and what their bump-in requirements are for the venue.",
  default: "I'm Ivy, your wedding planning assistant! I can help you draft emails to vendors, suggest budget breakdowns, or build your day-of timeline. What would you like to work on?"
};

export async function askIvy(message: string, weddingContext: any) {
  // Simulate network delay and "thinking"
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('budget') || lowerMsg.includes('cost') || lowerMsg.includes('money')) {
    return RESPONSES.budget;
  }
  if (lowerMsg.includes('time') || lowerMsg.includes('schedule') || lowerMsg.includes('run sheet')) {
    return RESPONSES.timeline;
  }
  if (lowerMsg.includes('vendor') || lowerMsg.includes('florist') || lowerMsg.includes('photographer')) {
    return RESPONSES.vendor;
  }
  
  return RESPONSES.default;
}
