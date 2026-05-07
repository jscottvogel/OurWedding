export type EmailType = 
  | 'save_the_date'
  | 'invitation'
  | 'rsvp_reminder'
  | 'event_reminder_1'
  | 'event_reminder_2'
  | 'thank_you';

export type PaletteKey = 'classic' | 'sage' | 'navy' | 'dusty_rose';

export interface WeddingEmailData {
  coupleName1: string;
  coupleName2: string;
  date?: string;
  time?: string;
  venue?: string;
  city?: string;
  rsvpDate?: string;
  rsvpLink?: string;
  websiteUrl?: string;
}

export interface RenderEmailParams {
  emailType: EmailType;
  weddingData: WeddingEmailData;
  paletteKey: PaletteKey;
  personalNote?: string;
  customContent?: string;
}

const PALETTES: Record<PaletteKey, { dark: string; accent: string; light: string; bg: string }> = {
  classic: { dark: '#2c2420', accent: '#b8975a', light: '#e8cec9', bg: '#faf7f2' },
  sage: { dark: '#3d5040', accent: '#6a8c6e', light: '#dde8dd', bg: '#f5faf5' },
  navy: { dark: '#1a2740', accent: '#8fa8c8', light: '#dce8f0', bg: '#f5f8fc' },
  dusty_rose: { dark: '#5a3a3a', accent: '#c8908a', light: '#f5e0da', bg: '#fdf5f3' },
};

function getEmailTypeDetails(type: EmailType, data: WeddingEmailData): { subtitle: string; mainText: string; ctaText?: string; ctaLink?: string } {
  switch (type) {
    case 'save_the_date':
      return {
        subtitle: 'SAVE THE DATE',
        mainText: 'We are thrilled to announce that we are getting married! Please save the date and plan to join us for our celebration. Formal invitation to follow.',
        ctaText: 'Visit Our Website',
        ctaLink: data.websiteUrl
      };
    case 'invitation':
      return {
        subtitle: 'FORMAL INVITATION',
        mainText: 'You are joyfully invited to our wedding. We would be honored to have you share in our special day.',
        ctaText: 'RSVP Now',
        ctaLink: data.rsvpLink || data.websiteUrl
      };
    case 'rsvp_reminder':
      return {
        subtitle: 'RSVP REMINDER',
        mainText: 'Our wedding is approaching and we would love to celebrate with you! Please let us know if you can make it by submitting your RSVP.',
        ctaText: 'Submit RSVP',
        ctaLink: data.rsvpLink || data.websiteUrl
      };
    case 'event_reminder_1':
      return {
        subtitle: 'WEDDING UPDATE',
        mainText: 'Our wedding is only a month away! We are getting so excited. Here are a few important details as the day approaches.',
        ctaText: 'View Wedding Details',
        ctaLink: data.websiteUrl
      };
    case 'event_reminder_2':
      return {
        subtitle: 'FINAL REMINDER',
        mainText: "The big day is almost here! We can't wait to celebrate with you. Please review the final details below.",
        ctaText: 'View Schedule',
        ctaLink: data.websiteUrl
      };
    case 'thank_you':
      return {
        subtitle: 'THANK YOU',
        mainText: 'Thank you so much for celebrating with us! Your presence and generosity made our day truly unforgettable.',
        ctaText: 'View Gallery',
        ctaLink: data.websiteUrl
      };
  }
}

export function renderEmailHtml(params: RenderEmailParams): string {
  const { emailType, weddingData, paletteKey, personalNote, customContent } = params;
  const palette = PALETTES[paletteKey] || PALETTES.classic;
  const details = getEmailTypeDetails(emailType, weddingData);
  const coupleNames = `${weddingData.coupleName1} & ${weddingData.coupleName2}`;

  const hasInfoBox = weddingData.date || weddingData.venue || weddingData.rsvpDate;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${details.subtitle} - ${coupleNames}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${palette.bg}; font-family: 'Georgia', serif; color: ${palette.dark}; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    
    <!-- Header Block -->
    <div style="background-color: ${palette.dark}; padding: 40px 20px; text-align: center; color: #ffffff;">
      <div style="font-family: 'Arial', sans-serif; font-size: 12px; letter-spacing: 4px; color: ${palette.light}; margin-bottom: 15px; text-transform: uppercase;">
        ${details.subtitle}
      </div>
      <h1 style="margin: 0; font-size: 32px; font-weight: normal;">${coupleNames}</h1>
    </div>
    
    <!-- Gradient Divider -->
    <div style="height: 4px; background: linear-gradient(to right, ${palette.dark}, ${palette.accent}, ${palette.light});"></div>

    <!-- Body Block -->
    <div style="padding: 40px 30px;">
      
      ${personalNote ? `
      <div style="margin-bottom: 30px; font-style: italic; font-size: 18px; text-align: center; color: ${palette.dark};">
        "${personalNote.replace(/\\n/g, '<br/>')}"
      </div>
      ` : ''}
      
      <div style="margin-bottom: 30px; font-size: 16px; text-align: center;">
        ${details.mainText}
      </div>
      
      ${hasInfoBox ? `
      <div style="background-color: ${palette.bg}; padding: 30px; margin-bottom: 30px; text-align: center; border: 1px solid ${palette.light};">
        ${weddingData.date ? `<div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${weddingData.date}</div>` : ''}
        ${weddingData.time ? `<div style="margin-bottom: 15px; font-size: 14px; color: ${palette.accent};">${weddingData.time}</div>` : ''}
        ${weddingData.venue ? `<div style="font-size: 16px; margin-bottom: 5px;">${weddingData.venue}</div>` : ''}
        ${weddingData.city ? `<div style="font-size: 16px; margin-bottom: 15px;">${weddingData.city}</div>` : ''}
        ${weddingData.rsvpDate && (emailType === 'invitation' || emailType === 'rsvp_reminder') ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${palette.light}; font-size: 14px;">
            <strong>Kindly RSVP by ${weddingData.rsvpDate}</strong>
          </div>
        ` : ''}
      </div>
      ` : ''}

      ${customContent ? `
      <div style="margin-bottom: 30px; font-size: 16px;">
        ${customContent.replace(/\\n/g, '<br/>')}
      </div>
      ` : ''}

      ${details.ctaLink && details.ctaText ? `
      <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
        <a href="${details.ctaLink}" style="display: inline-block; background-color: ${palette.accent}; color: #ffffff; text-decoration: none; padding: 14px 32px; font-family: 'Arial', sans-serif; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px;">
          ${details.ctaText}
        </a>
      </div>
      ` : ''}

    </div>

    <!-- Footer Block -->
    <div style="background-color: ${palette.dark}; color: ${palette.light}; padding: 40px 20px; text-align: center; font-size: 14px;">
      <div style="margin-bottom: 15px; font-size: 18px;">${coupleNames}</div>
      ${weddingData.websiteUrl ? `
      <div>
        <a href="${weddingData.websiteUrl}" style="color: ${palette.light}; text-decoration: none; font-family: 'Arial', sans-serif; letter-spacing: 1px; font-size: 12px; text-transform: uppercase;">
          Visit Our Website
        </a>
      </div>
      ` : ''}
    </div>

  </div>
</body>
</html>`;
}
