/**
 * PDF Formatting Schema for Monthly Fitness Reports
 * 
 * This schema defines the exact formatting requirements for each section
 * of the monthly fitness report PDF. The LLM should follow this structure
 * when generating content for the PDF.
 */

export interface PDFFormattingSchema {
  // Document Structure
  document: {
    pageSize: 'A4';
    orientation: 'portrait';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    colors: {
      primary: string; // Blue theme
      secondary: string; // Light gray
      accent: string; // Green for positive
      warning: string; // Red for concerns
      text: {
        primary: string;
        secondary: string;
        muted: string;
      };
    };
  };

  // Typography
  typography: {
    fonts: {
      primary: 'Helvetica';
      secondary: 'Helvetica-Bold';
      accent: 'Helvetica-Oblique';
    };
    sizes: {
      title: number; // 24pt
      heading1: number; // 16pt
      heading2: number; // 14pt
      heading3: number; // 12pt
      body: number; // 10pt
      caption: number; // 8pt
    };
    lineHeights: {
      title: number; // 27.6pt
      heading1: number; // 18.4pt
      heading2: number; // 16.1pt
      heading3: number; // 13.8pt
      body: number; // 11.5pt
      caption: number; // 9.2pt
    };
  };

  // Section Definitions
  sections: {
    header: {
      title: {
        text: 'Monthly Fitness Report';
        font: 'Helvetica-Bold';
        size: 24;
        color: 'white';
        position: { x: number; y: number };
      };
      subtitle: {
        text: 'CoachEZ Trainer Platform';
        font: 'Helvetica';
        size: 14;
        color: 'white';
        position: { x: number; y: number };
      };
      background: {
        color: '#3B82F6'; // Blue
        height: number;
      };
    };

    clientInfo: {
      background: {
        color: '#F7FAFC'; // Light gray
        padding: number;
      };
      clientName: {
        font: 'Helvetica-Bold';
        size: 16;
        color: 'black';
      };
      reportPeriod: {
        font: 'Helvetica';
        size: 12;
        color: 'black';
      };
      generatedDate: {
        font: 'Helvetica';
        size: 12;
        color: 'black';
      };
    };

    executiveSummary: {
      header: {
        text: 'Executive Summary';
        font: 'Helvetica-Bold';
        size: 16;
        color: 'white';
        background: '#3B82F6';
        height: number;
      };
      performanceScore: {
        font: 'Helvetica-Bold';
        size: 20;
        color: '#3B82F6';
        background: 'white';
        border: '#3B82F6';
        width: number;
        height: number;
      };
      performanceLabel: {
        font: 'Helvetica';
        size: 10;
        color: 'black';
      };
      overallPerformance: {
        font: 'Helvetica';
        size: 12;
        color: 'black';
        maxWidth: number;
      };
      keyAchievements: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
      areasOfConcern: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: '#EF4444'; // Red
          bullet: '•';
        };
      };
    };

    performanceMetrics: {
      header: {
        text: 'Performance Metrics';
        font: 'Helvetica-Bold';
        size: 16;
        color: 'white';
        background: '#3B82F6';
        height: number;
      };
      table: {
        header: {
          font: 'Helvetica-Bold';
          size: 11;
          color: 'black';
          background: '#E5E7EB';
        };
        rows: {
          alternating: {
            even: '#F7FAFC';
            odd: 'white';
          };
          font: 'Helvetica';
          size: 10;
          color: 'black';
        };
        columns: {
          metric: { width: '40%' };
          value: { width: '30%' };
          trend: { width: '30%' };
        };
        borders: {
          color: '#E5E7EB';
          width: number;
        };
      };
    };

    aiInsights: {
      header: {
        text: 'AI Analysis & Insights';
        font: 'Helvetica-Bold';
        size: 16;
        color: 'white';
        background: '#3B82F6';
        height: number;
      };
      whatIsWorking: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#22C55E'; // Green
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
      strengths: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
    };

    recommendations: {
      header: {
        text: 'Recommendations';
        font: 'Helvetica-Bold';
        size: 16;
        color: 'white';
        background: '#3B82F6';
        height: number;
      };
      priorityBadge: {
        font: 'Helvetica-Bold';
        size: 10;
        color: 'white';
        background: {
          high: '#EF4444'; // Red
          medium: '#F59E0B'; // Yellow
          low: '#22C55E'; // Green
        };
        width: number;
        height: number;
      };
      areasForImprovement: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
      specificActions: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
    };

    planForward: {
      header: {
        text: 'Plan Forward';
        font: 'Helvetica-Bold';
        size: 16;
        color: 'white';
        background: '#3B82F6';
        height: number;
      };
      nextMonthGoals: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
      actionSteps: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
      expectedOutcomes: {
        title: {
          font: 'Helvetica-Bold';
          size: 12;
          color: '#3B82F6';
        };
        items: {
          font: 'Helvetica';
          size: 10;
          color: 'black';
          bullet: '•';
        };
      };
    };

    footer: {
      font: 'Helvetica';
      size: 8;
      color: '#6B7280';
      border: {
        color: '#E5E7EB';
        width: number;
      };
      content: {
        left: 'Generated by CoachEZ Trainer Platform';
        center: 'Report for {clientName} - {month}';
        right: 'Page {pageNumber}';
      };
    };
  };

  // Content Guidelines
  contentGuidelines: {
    // Executive Summary
    executiveSummary: {
      overallPerformance: {
        maxLength: 200;
        tone: 'professional and encouraging';
        structure: '2-3 sentences summarizing key achievements and areas for improvement';
      };
      keyAchievements: {
        count: '3-5 items';
        format: 'bullet points starting with action verbs';
        focus: 'specific measurable accomplishments';
      };
      areasOfConcern: {
        count: '2-4 items';
        format: 'bullet points with actionable insights';
        tone: 'constructive and solution-oriented';
      };
      performanceScore: {
        range: '0-100';
        calculation: 'based on adherence, consistency, and progress';
      };
    };

    // AI Insights
    aiInsights: {
      whatIsWorking: {
        count: '3-5 items';
        focus: 'positive trends and strengths';
        format: 'specific observations with data support';
      };
      strengths: {
        count: '4-6 items';
        focus: 'client capabilities and positive behaviors';
        format: 'detailed explanations with context';
      };
    };

    // Recommendations
    recommendations: {
      areasForImprovement: {
        count: '3-5 items';
        focus: 'specific actionable areas';
        format: 'clear, measurable objectives';
      };
      specificActions: {
        count: '4-6 items';
        focus: 'immediate actionable steps';
        format: 'step-by-step instructions';
      };
      priorityLevel: {
        criteria: {
          high: 'critical issues affecting progress or health';
          medium: 'important improvements for better results';
          low: 'optimization opportunities';
        };
      };
    };

    // Plan Forward
    planForward: {
      nextMonthGoals: {
        count: '3-5 items';
        focus: 'SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)';
        format: 'clear objectives with target metrics';
      };
      actionSteps: {
        count: '4-6 items';
        focus: 'immediate next steps';
        format: 'concrete actions with timelines';
      };
      expectedOutcomes: {
        count: '3-4 items';
        focus: 'measurable results';
        format: 'specific outcomes with metrics';
      };
    };
  };

  // Technical Specifications
  technical: {
    pageBreak: {
      minSpaceBefore: number;
      sectionSpacing: number;
      subsectionSpacing: number;
    };
    textWrapping: {
      maxWidth: number;
      lineHeight: number;
      paragraphSpacing: number;
    };
    colors: {
      primary: '#3B82F6'; // Blue
      secondary: '#F7FAFC'; // Light gray
      accent: '#22C55E'; // Green
      warning: '#EF4444'; // Red
      muted: '#6B7280'; // Gray
    };
  };
}

/**
 * LLM Content Generation Guidelines
 * 
 * When generating content for the PDF, the LLM should follow these guidelines:
 */

export const LLMContentGuidelines = {
  // Overall Tone
  tone: {
    primary: 'professional and encouraging';
    secondary: 'data-driven and actionable';
    avoid: 'judgmental or overly technical language';
  },

  // Content Structure
  structure: {
    executiveSummary: {
      opening: 'Start with a positive overview of the client\'s performance';
      body: 'Include specific achievements and areas for improvement';
      closing: 'End with an encouraging note about potential';
    },
    insights: {
      focus: 'Data-backed observations with clear explanations';
      balance: 'Equal emphasis on strengths and improvement areas';
      actionable: 'Every insight should lead to a recommendation';
    },
    recommendations: {
      priority: 'Order by impact and feasibility';
      specificity: 'Include exact numbers, times, and frequencies';
      personalization: 'Tailor to client\'s specific situation and goals';
    },
    planForward: {
      realistic: 'Set achievable goals based on current performance';
      progressive: 'Build on existing strengths';
      measurable: 'Include specific metrics for tracking progress';
    }
  },

  // Language Guidelines
  language: {
    use: [
      'Clear, concise sentences',
      'Action-oriented language',
      'Specific numbers and metrics',
      'Positive reinforcement',
      'Constructive feedback'
    ],
    avoid: [
      'Vague statements',
      'Negative language',
      'Overly technical jargon',
      'Generic advice',
      'Unrealistic expectations'
    ]
  },

  // Data Integration
  dataIntegration: {
    metrics: 'Reference specific numbers from the client\'s data';
    trends: 'Explain what the data means in practical terms';
    context: 'Provide background for why certain metrics matter';
    comparisons: 'Compare current performance to targets or previous periods';
  }
};

/**
 * Example Content Structure
 */
export const ExampleContentStructure = {
  executiveSummary: {
    overallPerformance: "Vikas has demonstrated consistent engagement with the fitness program, showing strong commitment to tracking and data collection. With 376 activity records over 30 days, he maintains good consistency, though there are opportunities to optimize nutrition and workout intensity for better results.",
    keyAchievements: [
      "Maintained 75% workout adherence rate",
      "Consistently logged 376 activity records",
      "Stable body measurements indicating no muscle loss",
      "Good stress management and psychological well-being"
    ],
    areasOfConcern: [
      "Protein intake critically low at 10.5g/day",
      "Caloric intake far below maintenance needs",
      "Sleep duration below optimal range",
      "Workout intensity needs improvement"
    ],
    performanceScore: 75
  },

  recommendations: {
    priorityLevel: "high",
    areasForImprovement: [
      "Increase daily protein intake to 100-130g",
      "Boost caloric intake to 2,200-2,500 kcal/day",
      "Improve sleep duration to 7-8 hours/night",
      "Enhance workout intensity and duration"
    ],
    specificActions: [
      "Add 3 high-protein meals/snacks daily",
      "Use food tracking app to monitor intake",
      "Establish consistent bedtime routine",
      "Extend workouts to 60-75 minutes with progressive overload"
    ]
  }
};
