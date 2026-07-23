import { EmailTemplate, NotificationType } from '../types/notification.interface';

export default class EmailService {
  private templates: Map<NotificationType, EmailTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    this.templates.set(NotificationType.WELCOME, {
      type: NotificationType.WELCOME,
      subject: 'Welcome to SoccerHub!',
      htmlContent: `
        <h1>Welcome to SoccerHub!</h1>
        <p>Hi {{recipientName}},</p>
        <p>Thanks for joining SoccerHub, your ultimate soccer coordination platform!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and join soccer games in your area</li>
          <li>Host your own games and manage bookings</li>
          <li>Connect with other soccer enthusiasts</li>
          <li>Rate and review players and hosts</li>
        </ul>
        <p><a href="{{appUrl}}">Get Started</a></p>
        <p>Best regards,<br/>SoccerHub Team</p>
      `,
      textContent: `Welcome to SoccerHub! Hi {{recipientName}}, thanks for joining! You can now browse games, host events, and connect with other players.`,
    });

    this.templates.set(NotificationType.BOOKING_CONFIRMATION, {
      type: NotificationType.BOOKING_CONFIRMATION,
      subject: 'Booking Confirmed: {{eventTitle}}',
      htmlContent: '<h1>Booking Confirmed!</h1>'
        + '<p>Hi {{recipientName}},</p>'
        + '<p>Your booking for <strong>{{eventTitle}}</strong> is confirmed!</p>'
        + '<h3>Event Details:</h3>'
        + '<ul>'
        + '<li><strong>Date:</strong> {{eventDate}}</li>'
        + '<li><strong>Time:</strong> {{eventTime}}</li>'
        + '<li><strong>Location:</strong> {{eventLocation}}</li>'
        + '<li><strong>Price Paid:</strong> ${{eventPrice}}</li>'
        + '</ul>'
        + '<h3>Host Information:</h3>'
        + '<p><strong>{{hostName}}</strong><br/>Rating: {{hostRating}} ⭐</p>'
        + '<p><a href="{{eventDetailsUrl}}">View Event Details</a></p>'
        + '<p>If you need to cancel, please do so at least 24 hours before the event.</p>'
        + '<p>See you on the field!<br/>SoccerHub Team</p>',
      textContent: 'Your booking for {{eventTitle}} is confirmed! Date: {{eventDate}}, Location: {{eventLocation}}, Price: ${{eventPrice}}',
    });

    this.templates.set(NotificationType.BOOKING_CANCELLED, {
      type: NotificationType.BOOKING_CANCELLED,
      subject: 'Booking Cancelled: {{eventTitle}}',
      htmlContent: '<h1>Booking Cancelled</h1>'
        + '<p>Hi {{recipientName}},</p>'
        + '<p>Your booking for <strong>{{eventTitle}}</strong> has been cancelled.</p>'
        + '<h3>Cancellation Details:</h3>'
        + '<ul>'
        + '<li><strong>Event:</strong> {{eventTitle}}</li>'
        + '<li><strong>Date:</strong> {{eventDate}}</li>'
        + '<li><strong>Refund Amount:</strong> ${{refundAmount}}</li>'
        + '<li><strong>Reason:</strong> {{cancellationReason}}</li>'
        + '</ul>'
        + '<p>Your refund of ${{refundAmount}} will be processed within 3-5 business days.</p>'
        + '<p><a href="{{browseEventsUrl}}">Browse Other Events</a></p>'
        + '<p>Thanks for understanding,<br/>SoccerHub Team</p>',
      textContent: 'Your booking for {{eventTitle}} has been cancelled. Refund: ${{refundAmount}}, Status: Processing in 3-5 business days.',
    });

    this.templates.set(NotificationType.EVENT_REMINDER, {
      type: NotificationType.EVENT_REMINDER,
      subject: 'Reminder: {{eventTitle}} starts in 24 hours!',
      htmlContent: `
        <h1>Event Reminder!</h1>
        <p>Hi {{recipientName}},</p>
        <p>Your soccer game <strong>{{eventTitle}}</strong> starts in 24 hours!</p>
        <h3>Quick Details:</h3>
        <ul>
          <li><strong>When:</strong> {{eventDate}} at {{eventTime}}</li>
          <li><strong>Where:</strong> {{eventLocation}}</li>
          <li><strong>Players:</strong> {{currentParticipants}}/{{maxCapacity}}</li>
        </ul>
        <p>Make sure you're ready and arrive 10 minutes early!</p>
        <p><a href="{{eventDetailsUrl}}">View Full Details</a></p>
        <p>See you soon!<br/>SoccerHub Team</p>
      `,
      textContent: `Reminder: {{eventTitle}} starts in 24 hours at {{eventTime}} in {{eventLocation}}. Be there 10 minutes early!`,
    });

    this.templates.set(NotificationType.EVENT_COMPLETED, {
      type: NotificationType.EVENT_COMPLETED,
      subject: 'Event Completed: {{eventTitle}} - Leave a Review!',
      htmlContent: `
        <h1>Event Completed!</h1>
        <p>Hi {{recipientName}},</p>
        <p>Thank you for attending <strong>{{eventTitle}}</strong>!</p>
        <h3>Event Summary:</h3>
        <ul>
          <li><strong>Event:</strong> {{eventTitle}}</li>
          <li><strong>Date:</strong> {{eventDate}}</li>
          <li><strong>Participants:</strong> {{finalParticipantCount}}</li>
        </ul>
        <h3>Host: {{hostName}}</h3>
        <p>Please take a moment to rate and review the host and other players:</p>
        <p><a href="{{reviewUrl}}">Leave a Review</a></p>
        <p>Your feedback helps the community maintain high standards!</p>
        <p>Thanks for playing!<br/>SoccerHub Team</p>
      `,
      textContent: `Event {{eventTitle}} is completed! Please leave a review for the host {{hostName}} and other players.`,
    });

    this.templates.set(NotificationType.HOST_REVIEW, {
      type: NotificationType.HOST_REVIEW,
      subject: 'New Review from {{reviewerName}}',
      htmlContent: `
        <h1>You have a new review!</h1>
        <p>Hi {{hostName}},</p>
        <p><strong>{{reviewerName}}</strong> just left you a review after {{eventTitle}}!</p>
        <h3>Review:</h3>
        <p><strong>Rating: {{rating}}/5 ⭐</strong></p>
        <p><em>"{{reviewComment}}"</em></p>
        <h3>Your Stats:</h3>
        <ul>
          <li><strong>Average Rating:</strong> {{avgRating}}/5</li>
          <li><strong>Total Reviews:</strong> {{totalReviews}}</li>
        </ul>
        <p><a href="{{dashboardUrl}}">View Your Dashboard</a></p>
        <p>Great job keeping your rating high!<br/>SoccerHub Team</p>
      `,
      textContent: `{{reviewerName}} left you a {{rating}}/5 review: "{{reviewComment}}" Your new average rating: {{avgRating}}/5`,
    });

    this.templates.set(NotificationType.EVENT_UPDATED, {
      type: NotificationType.EVENT_UPDATED,
      subject: 'Event Updated: {{eventTitle}}',
      htmlContent: `
        <h1>Event Updated</h1>
        <p>Hi {{recipientName}},</p>
        <p>The event you're registered for has been updated:</p>
        <h3>{{eventTitle}}</h3>
        <h4>What Changed:</h4>
        <ul>
          {{#changes}}<li>{{this}}</li>{{/changes}}
        </ul>
        <p><strong>New Details:</strong></p>
        <ul>
          <li><strong>Date:</strong> {{eventDate}}</li>
          <li><strong>Time:</strong> {{eventTime}}</li>
          <li><strong>Location:</strong> {{eventLocation}}</li>
        </ul>
        <p><a href="{{eventDetailsUrl}}">View Updated Event</a></p>
        <p>If you have any concerns, please contact the host.</p>
        <p>SoccerHub Team</p>
      `,
      textContent: `Event {{eventTitle}} has been updated. New date: {{eventDate}} at {{eventTime}} in {{eventLocation}}.`,
    });
  }

  getTemplate(type: NotificationType): EmailTemplate | undefined {
    return this.templates.get(type);
  }

  renderTemplate(template: EmailTemplate, data: Record<string, any>): { subject: string; html: string; text: string } {
    const renderString = (str: string): string => {
      let result = str;
      Object.entries(data).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
      });
      return result;
    };

    return {
      subject: renderString(template.subject),
      html: renderString(template.htmlContent),
      text: renderString(template.textContent),
    };
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }
}
