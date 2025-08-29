# Client Insights Cards - Dashboard Feature

## Overview

The Client Insights Cards feature adds three interactive, flipable cards to the main dashboard that provide trainers with key performance metrics across all their clients:

1. **Fitness Momentum** - Shows workout volume trends over 3 weeks
2. **Workout Adherence** - Displays 14-day completion rates
3. **Client Engagement** - Shows daily engagement scores

## Features

### Front Side (Default View)
- **Large metric display** with trend indicators
- **Summary statistics** showing counts of top performers and those needing support
- **Visual progress bars** for adherence and engagement
- **Trend badges** (Up/Flat/Down) with color coding
- **Click to flip** instruction

### Back Side (Flipped View)
- **Top 3 performers** with their specific metrics
- **Bottom 3 performers** who need attention
- **Client names** with performance badges
- **Actionable insights** for trainers

## Installation

### 1. Database Setup

Run the SQL views from `database-views.sql` in your Supabase database:

```sql
-- Create the required views
-- momentum_3w, adherence_14d, engagement_14d
```

### 2. Component Files

The following files have been created/modified:

- `client/src/components/dashboard/ClientInsightsCards.tsx` - Main component
- `client/src/pages/Dashboard.tsx` - Updated to include the cards
- `client/src/index.css` - Added flip animation styles
- `database-views.sql` - Database views for data

### 3. Dependencies

Ensure you have the required packages:

```bash
npm install recharts lucide-react
```

## Usage

### Dashboard Integration

The cards are automatically displayed at the top of the main dashboard above the calendar and todo list.

### Data Sources

The cards pull data from:

- **`workout_info`** table - For workout volume and momentum calculations
- **`schedule`** table - For adherence/completion rates
- **`client_engagement_score`** table - For engagement metrics
- **`client`** table - For client names and information

### Real-time Updates

Data is fetched when the component mounts and can be refreshed by calling `fetchInsightsData()`.

## Customization

### Styling

The cards use Tailwind CSS classes and can be customized by modifying:

- Color schemes in `getTrendColor()` function
- Card dimensions and spacing
- Animation timing in CSS

### Metrics

You can modify the calculation logic in:

- `processMomentumData()` - Volume change calculations
- `processAdherenceData()` - Completion rate logic
- `processEngagementData()` - Engagement score processing

### Thresholds

Adjust performance thresholds in the trend calculation:

```typescript
// Momentum thresholds
const trend = average > 5 ? 'up' : average < -5 ? 'down' : 'stable'

// Adherence thresholds  
const trend = average > 80 ? 'up' : average < 60 ? 'down' : 'stable'

// Engagement thresholds
const trend = average > 75 ? 'up' : average < 50 ? 'down' : 'stable'
```

## Technical Details

### Flip Animation

Uses CSS 3D transforms with:
- `perspective: 1000px` for 3D effect
- `transform-style: preserve-3d` for proper layering
- `backface-visibility: hidden` to hide reverse sides
- Smooth transitions with `transition: all 0.5s ease-in-out`

### State Management

- `flippedCards` Set tracks which cards are flipped
- `insightsData` stores processed metrics data
- `loading` state handles data fetching

### Error Handling

- Graceful fallbacks for missing data
- Loading skeletons during data fetch
- Error states for failed requests

## Performance Considerations

### Database Optimization

- Indexes on frequently queried columns
- Efficient SQL views with proper joins
- Date range filtering to limit data

### Frontend Optimization

- Memoized calculations where possible
- Efficient state updates
- Minimal re-renders

## Troubleshooting

### Common Issues

1. **Cards not flipping**: Check CSS classes and ensure `flip-card` wrapper is present
2. **No data showing**: Verify database views exist and have data
3. **Performance issues**: Check database indexes and query optimization

### Debug Mode

Enable console logging by checking the browser console for:
- Data fetch results
- Processing steps
- Error messages

## Future Enhancements

Potential improvements:

- **Real-time updates** with WebSocket connections
- **Export functionality** for reports
- **Drill-down views** for individual clients
- **Historical trends** with charts
- **Action items** generation from insights
- **Integration** with notification systems

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify database views are properly created
3. Ensure all required tables have data
4. Check component props and state management
