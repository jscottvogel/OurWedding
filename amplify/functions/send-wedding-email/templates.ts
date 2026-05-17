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
  photoUrl?: string;
  galleryUrl?: string;
  guestbookUrl?: string;
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
        ctaText: undefined,
        ctaLink: undefined
      };
  }
}

export function renderEmailHtml(params: RenderEmailParams): string {
  const { emailType, weddingData, paletteKey, personalNote, customContent } = params;
  const palette = PALETTES[paletteKey] || PALETTES.classic;
  const details = getEmailTypeDetails(emailType, weddingData);
  const coupleNames = `${weddingData.coupleName1} & ${weddingData.coupleName2}`;

  const hasInfoBox = emailType !== 'thank_you' && (weddingData.date || weddingData.venue || weddingData.rsvpDate);

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>${details.subtitle} - ${coupleNames}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    .email-container { max-width: 600px; margin: auto; }
    @media screen and (max-width: 600px) {
      .responsive-pad { padding: 30px 20px !important; }
      .title-text { font-size: 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${palette.bg}; font-family: 'Montserrat', Arial, sans-serif; color: ${palette.dark}; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <div style="background-color: ${palette.bg}; padding: 40px 0;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <!-- Main Card -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            
            <!-- Header Area -->
            <tr>
              <td align="center" style="background-color: ${palette.dark}; padding: 60px 20px;">
                <p style="font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 6px; color: ${palette.light}; margin: 0 0 20px 0; text-transform: uppercase; font-weight: 500;">
                  ${details.subtitle}
                </p>
                <h1 class="title-text" style="margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 400; color: #ffffff; letter-spacing: 1px;">
                  ${coupleNames}
                </h1>
              </td>
            </tr>
            
            <!-- Elegant Gold/Accent Line -->
            <tr>
              <td style="height: 4px; background: linear-gradient(90deg, ${palette.dark} 0%, ${palette.accent} 50%, ${palette.dark} 100%);"></td>
            </tr>

            <!-- Body Area -->
            <tr>
              <td align="center" class="responsive-pad" style="padding: 50px 40px;">
                
                ${personalNote ? `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 22px; color: ${palette.accent}; line-height: 1.5; padding: 0 20px;">
                      "${personalNote.replace(/\\n/g, '<br/>')}"
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Montserrat', sans-serif; font-size: 15px; color: #4a4a4a; line-height: 1.8; font-weight: 300;">
                      ${details.mainText}
                    </td>
                  </tr>
                </table>
                
                ${weddingData.photoUrl ? `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center">
                      <img src="${weddingData.photoUrl}" alt="Wedding Photo" width="520" style="width: 100%; max-width: 520px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: block;" />
                    </td>
                  </tr>
                </table>
                ` : ''}
                
                ${hasInfoBox ? `
                <!-- Info Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${palette.bg}; border-radius: 8px; margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="padding: 40px 30px;">
                      
                      ${weddingData.date ? `
                      <div style="font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; color: ${palette.dark}; margin-bottom: 8px;">
                        ${weddingData.date}
                      </div>
                      ` : ''}
                      
                      ${weddingData.time ? `
                      <div style="font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 500; color: ${palette.accent}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 25px;">
                        ${weddingData.time}
                      </div>
                      ` : ''}
                      
                      ${(weddingData.venue || weddingData.city) ? `
                      <div style="width: 40px; height: 1px; background-color: ${palette.accent}; margin: 0 auto 25px auto; opacity: 0.5;"></div>
                      ` : ''}
                      
                      ${weddingData.venue ? `
                      <div style="font-family: 'Montserrat', sans-serif; font-size: 16px; color: ${palette.dark}; font-weight: 500; margin-bottom: 6px;">
                        ${weddingData.venue}
                      </div>
                      ` : ''}
                      
                      ${weddingData.city ? `
                      <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #666666; font-weight: 300;">
                        ${weddingData.city}
                      </div>
                      ` : ''}
                      
                      ${weddingData.rsvpDate && (emailType === 'invitation' || emailType === 'rsvp_reminder') ? `
                      <div style="margin-top: 30px; padding-top: 25px; border-top: 1px dashed ${palette.accent}; font-family: 'Montserrat', sans-serif; font-size: 13px; color: ${palette.dark}; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                        Kindly RSVP by ${weddingData.rsvpDate}
                      </div>
                      ` : ''}
                      
                    </td>
                  </tr>
                </table>
                ` : ''}

                ${customContent ? `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Montserrat', sans-serif; font-size: 15px; color: #4a4a4a; line-height: 1.8; font-weight: 300;">
                      ${customContent.replace(/\\n/g, '<br/>')}
                    </td>
                  </tr>
                </table>
                ` : ''}

                ${details.ctaLink && details.ctaText ? `
                <!-- CTA Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" bgcolor="${palette.accent}" style="border-radius: 30px;">
                            <a href="${details.ctaLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 30px; border: 1px solid ${palette.accent};">
                              ${details.ctaText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                ` : ''}

                ${emailType === 'thank_you' && (weddingData.galleryUrl || weddingData.guestbookUrl) ? `
                <!-- Thank You Action Links -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          ${weddingData.galleryUrl ? `
                          <td align="center" bgcolor="${palette.accent}" style="border-radius: 30px; padding: 0 10px;">
                            <a href="${weddingData.galleryUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 30px; border: 1px solid ${palette.accent};">
                              View Gallery
                            </a>
                          </td>
                          ` : ''}
                          ${weddingData.guestbookUrl ? `
                          <td align="center" bgcolor="${palette.bg}" style="border-radius: 30px; padding: 0 10px;">
                            <a href="${weddingData.guestbookUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Montserrat', sans-serif; font-size: 12px; color: ${palette.dark}; text-decoration: none; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border-radius: 30px; border: 1px solid ${palette.accent};">
                              View Guestbook
                            </a>
                          </td>
                          ` : ''}
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                ` : ''}

              </td>
            </tr>

            <!-- Footer Area -->
            <tr>
              <td align="center" style="background-color: ${palette.bg}; padding: 40px 20px; border-top: 1px solid #eeeeee;">
                <p style="font-family: 'Cormorant Garamond', serif; font-size: 24px; color: ${palette.dark}; margin: 0 0 15px 0; font-style: italic;">
                  ${coupleNames}
                </p>
                ${weddingData.websiteUrl ? `
                <p style="margin: 0;">
                  <a href="${weddingData.websiteUrl}" style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${palette.accent}; text-decoration: none; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
                    Visit Our Website
                  </a>
                </p>
                ` : ''}
              </td>
            </tr>
            
          </table>
          <!-- End Main Card -->
          
          <!-- Spacer -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td height="40" style="font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>
          
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
