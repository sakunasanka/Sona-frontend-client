import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface BookingCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  availabilityData?: {
    [dateKey: string]: {
      isAvailable: boolean;
      hasImmediateSlot?: boolean;
    };
  };
  isLoading?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onMonthChange?: (year: number, month: number) => void;
}

interface DayInfo {
  date: Date | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  hasImmediateSlot?: boolean;
}

/**
 * BookingCalendar - An enhanced calendar component for booking sessions
 * 
 * Features:
 * - Shows available/unavailable dates with proper coloring
 * - Supports month navigation with proper restrictions
 * - Shows loading state
 * - Provides month change callback for data fetching
 */
const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedDate,
  onDateSelect,
  availabilityData = {},
  isLoading = false,
  minDate = new Date(),
  maxDate,
  onMonthChange
}) => {
  // Normalize dates for comparison
  const minDateNormalized = useMemo(() => {
    const date = new Date(minDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [minDate]);
  
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Set default max date if not provided (3 months from today)
  const normalizedMaxDate = useMemo(() => {
    if (maxDate) return maxDate;
    const date = new Date(today);
    date.setMonth(today.getMonth() + 3);
    return date;
  }, [today, maxDate]);

  // Track the currently displayed month/year
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date(selectedDate));

  // Format date as YYYY-MM-DD for availabilityData lookup
  const formatDateKey = (date: Date): string => {
    // Get the year, month, and day without timezone manipulation
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    
    // Format as YYYY-MM-DD string
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Only log occasionally to avoid console spam
    if (day === 1 || day === 15) {
      console.log(`[BookingCalendar] Formatting date ${date.toLocaleDateString()} as key: ${dateKey}`);
    }
    
    return dateKey;
  };

  // Check if a specific date is available
  const isDateAvailable = (date: Date): boolean => {
    const key = formatDateKey(date);
    return availabilityData[key]?.isAvailable === true;
  };

  // Go to previous month
  const goToPreviousMonth = () => {
    if (!canGoToPreviousMonth()) return;
    
    console.log(`[BookingCalendar] Going to previous month from ${displayedMonth.getFullYear()}-${displayedMonth.getMonth() + 1}`);
    
    const newDisplayedMonth = new Date(displayedMonth);
    newDisplayedMonth.setMonth(displayedMonth.getMonth() - 1);
    
    console.log(`[BookingCalendar] New month will be ${newDisplayedMonth.getFullYear()}-${newDisplayedMonth.getMonth() + 1}`);
    
    setDisplayedMonth(newDisplayedMonth);
    
    if (onMonthChange) {
      console.log(`[BookingCalendar] Calling onMonthChange(${newDisplayedMonth.getFullYear()}, ${newDisplayedMonth.getMonth()})`);
      onMonthChange(newDisplayedMonth.getFullYear(), newDisplayedMonth.getMonth());
    }
  };

  // Go to next month
  const goToNextMonth = () => {
    if (!canGoToNextMonth()) return;
    
    console.log(`[BookingCalendar] Going to next month from ${displayedMonth.getFullYear()}-${displayedMonth.getMonth() + 1}`);
    
    const newDisplayedMonth = new Date(displayedMonth);
    newDisplayedMonth.setMonth(displayedMonth.getMonth() + 1);
    
    console.log(`[BookingCalendar] New month will be ${newDisplayedMonth.getFullYear()}-${newDisplayedMonth.getMonth() + 1}`);
    
    setDisplayedMonth(newDisplayedMonth);
    
    if (onMonthChange) {
      console.log(`[BookingCalendar] Calling onMonthChange(${newDisplayedMonth.getFullYear()}, ${newDisplayedMonth.getMonth()})`);
      onMonthChange(newDisplayedMonth.getFullYear(), newDisplayedMonth.getMonth());
    }
  };

  // Check if can go to previous month
  const canGoToPreviousMonth = (): boolean => {
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get displayed month details
    const displayedMonthValue = displayedMonth.getMonth();
    const displayedYearValue = displayedMonth.getFullYear();
    
    // Allow going to previous month if:
    // 1. The displayed month is after the current month
    // 2. OR if we're in a future year
    return (displayedMonthValue > currentMonth && displayedYearValue === currentYear) || 
           (displayedYearValue > currentYear);
  };

  // Check if can go to next month
  const canGoToNextMonth = (): boolean => {
    const nextMonth = new Date(displayedMonth);
    nextMonth.setMonth(displayedMonth.getMonth() + 1);
    return nextMonth <= normalizedMaxDate;
  };

  // Get days for the current month view
  const getDaysForMonthView = (): DayInfo[][] => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to show (Monday starts the week)
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Create days grid (6 rows max, 7 columns)
    const days: DayInfo[][] = [[]];
    let currentWeek = 0;
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i + 1);
      const dateKey = formatDateKey(date);
      
      days[currentWeek].push({
        date,
        isCurrentMonth: false,
        isToday: formatDateKey(date) === formatDateKey(today),
        isSelected: formatDateKey(date) === formatDateKey(selectedDate),
        isAvailable: false, // Previous month dates are always unavailable
        hasImmediateSlot: availabilityData[dateKey]?.hasImmediateSlot || false,
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateKey = formatDateKey(date);
      
      if (days[currentWeek].length === 7) {
        days.push([]);
        currentWeek++;
      }
      

      
      // For current month, the availability depends on the API data
      // If we have data for this date, use it; otherwise assume unavailable
      const dateAvailability = availabilityData[dateKey];
      const isAvailable = dateAvailability?.isAvailable === true;
      
      // Log every 5 days to avoid cluttering the console
      if (i % 5 === 0 || i === 1) {
        console.log(`[BookingCalendar] Day ${dateKey}: isAvailable=${isAvailable}, hasData=${!!dateAvailability}`);
      }
      
      days[currentWeek].push({
        date,
        isCurrentMonth: true,
        isToday: formatDateKey(date) === formatDateKey(today),
        isSelected: formatDateKey(date) === formatDateKey(selectedDate),
        isAvailable: isAvailable,
        hasImmediateSlot: dateAvailability?.hasImmediateSlot || false,
      });
    }
    
    // Add days from next month to fill the grid
    let nextMonthDay = 1;
    while (days[currentWeek].length < 7) {
      const date = new Date(year, month + 1, nextMonthDay);
      const dateKey = formatDateKey(date);
      
      days[currentWeek].push({
        date,
        isCurrentMonth: false,
        isToday: formatDateKey(date) === formatDateKey(today),
        isSelected: formatDateKey(date) === formatDateKey(selectedDate),
        isAvailable: false, // Next month dates are always unavailable
        hasImmediateSlot: availabilityData[dateKey]?.hasImmediateSlot || false,
      });
      
      nextMonthDay++;
    }
    
    // Add another row if needed (for months that need 6 rows)
    if (days.length < 6) {
      days.push([]);
      currentWeek++;
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(year, month + 1, nextMonthDay);
        const dateKey = formatDateKey(date);
        
        days[currentWeek].push({
          date,
          isCurrentMonth: false,
          isToday: formatDateKey(date) === formatDateKey(today),
          isSelected: formatDateKey(date) === formatDateKey(selectedDate),
          isAvailable: false, // Next month dates are always unavailable
          hasImmediateSlot: availabilityData[dateKey]?.hasImmediateSlot || false,
        });
        
        nextMonthDay++;
      }
    }
    
    return days;
  };

  // Handle day selection
  const handleDaySelect = (day: DayInfo) => {
    if (!day.date) return;
    
    // Don't allow selection of dates not in current month or unavailable dates
    if (!day.isCurrentMonth) {
      return;
    }
    
    // If the date is in the current month, allow selection
    // The UI will already show unavailable days in light red
    // But the API should be the source of truth for availability
    onDateSelect(day.date);
  };

  // Get month and year for header
  const getMonthYearHeader = (): string => {
    return displayedMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Calculate days for the current month view
  const days = useMemo(() => {
    console.log(`[BookingCalendar] Recalculating days for ${displayedMonth.getFullYear()}-${displayedMonth.getMonth() + 1}`);
    console.log(`[BookingCalendar] Available data has ${Object.keys(availabilityData).length} days, with ${Object.values(availabilityData).filter(day => day.isAvailable).length} available`);
    return getDaysForMonthView();
  }, [displayedMonth, availabilityData, selectedDate, today]);

  // Days of week headers
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View className="bg-white p-4 rounded-2xl">
      
      {/* Availability Status */}
      {isLoading ? (
        <View className="mb-4 px-3 py-2 rounded-lg bg-blue-50">
          <Text className="text-xs text-blue-800">
            Checking counselor's availability...
          </Text>
        </View>
      ) : Object.keys(availabilityData).length > 0 ? (
        <View className={`mb-4 px-3 py-2 rounded-lg ${
          Object.values(availabilityData).some(day => day.isAvailable) 
            ? 'bg-green-50' 
            : 'bg-red-50'
        }`}>
          <Text className={`text-xs ${
            Object.values(availabilityData).some(day => day.isAvailable)
              ? 'text-green-800' 
              : 'text-red-800'
          }`}>
            {Object.values(availabilityData).some(day => day.isAvailable)
              ? 'Available days found for this month' 
              : 'No availability for this month'}
          </Text>
        </View>
      ) : null}
      
      {/* Calendar header with month/year and navigation buttons */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity 
          onPress={goToPreviousMonth}
          disabled={!canGoToPreviousMonth()}
          className={`p-3 ${!canGoToPreviousMonth() ? 'opacity-40 bg-gray-100' : 'bg-gray-50'} rounded-full`}
          accessibilityLabel="Previous month"
        >
          <ChevronLeft color={canGoToPreviousMonth() ? "#374151" : "#9CA3AF"} size={18} />
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-gray-900">{getMonthYearHeader()}</Text>
        
        <TouchableOpacity 
          onPress={goToNextMonth}
          disabled={!canGoToNextMonth()}
          className={`p-3 ${!canGoToNextMonth() ? 'opacity-40 bg-gray-100' : 'bg-gray-50'} rounded-full`}
          accessibilityLabel="Next month"
        >
          <ChevronRight color={canGoToNextMonth() ? "#374151" : "#9CA3AF"} size={18} />
        </TouchableOpacity>
      </View>
      
      {/* Loading Indicator */}
      {isLoading ? (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-gray-600 font-medium">Loading availability...</Text>
        </View>
      ) : (
        <>
          {/* Days of week header */}
          <View className="flex-row mb-2">
            {daysOfWeek.map((day, index) => (
              <View key={index} className="flex-1 items-center">
                <Text className="text-gray-500 font-medium text-xs">{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Calendar grid */}
          <View>
            {days.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} className="flex-row mb-2">
                {week.map((day, dayIndex) => {
                  // Determine if date is selectable
                  const dateToCheck = day.date ? new Date(day.date) : null;
                  if (dateToCheck) dateToCheck.setHours(0, 0, 0, 0);
                  
                  const isSelectable = day.date && 
                    dateToCheck && 
                    day.isCurrentMonth &&
                    dateToCheck >= minDateNormalized && 
                    (!normalizedMaxDate || dateToCheck <= normalizedMaxDate);
                  
                  // Determine cell style based on availability and selection
                  let cellStyle = "bg-white";
                  
                  if (day.isSelected) {
                    // Selected days get the primary color
                    cellStyle = "bg-primary";
                  } else if (!day.isCurrentMonth) {
                    // Days outside current month are faded
                    cellStyle = "bg-gray-50 opacity-40";
                  } else if (day.date && day.isCurrentMonth) {
                    if (!day.isAvailable) {
                      // Unavailable days in current month are shaded light red
                      cellStyle = "bg-red-50";
                    } else if (day.hasImmediateSlot) {
                      // Days with immediate availability have green background
                      cellStyle = "bg-green-50";
                    } else if (day.isToday) {
                      // Today's date gets a blue tint
                      cellStyle = "bg-blue-50";
                    }
                  }
                  
                  // Determine if the date is in the past
                  const isPastDate = day.date ? day.date < minDateNormalized : false;
                  
                  return (
                    <TouchableOpacity
                      key={`day-${dayIndex}`}
                      onPress={() => handleDaySelect(day)}
                      // Allow selecting all dates in current month, regardless of availability
                      // User will see no timeslots if the date is unavailable
                      disabled={!day.isCurrentMonth || isPastDate} 
                      className={`flex-1 aspect-square items-center justify-center rounded-lg ${cellStyle} ${
                        !day.isCurrentMonth || isPastDate ? 'opacity-50' : ''
                      }`}
                    >
                      <Text 
                        className={`text-base ${
                          day.isSelected 
                            ? 'text-white font-semibold' 
                            : day.isToday
                            ? 'text-primary font-semibold'
                            : 'text-gray-800'
                        }`}
                      >
                        {day.date?.getDate()}
                      </Text>
                      
                      {/* Availability indicator - only shown for available days */}
                      {day.date && day.isCurrentMonth && !day.isSelected && (
                        <View className="flex-row mt-1">
                          {day.isAvailable ? (
                            <>
                              <View className="w-2 h-2 rounded-full bg-green-500" />
                              {day.hasImmediateSlot && (
                                <View className="ml-1">
                                  <Text className="text-[6px] text-green-600 font-bold">NOW</Text>
                                </View>
                              )}
                            </>
                          ) : null}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          
          {/* Legend */}
          <View className="flex-row justify-center mt-4 space-x-4">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-1" />
              <Text className="text-xs text-gray-600 mr-2">Available</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-lg bg-red-50 mr-1" />
              <Text className="text-xs text-gray-600 mr-2">Unavailable</Text>
            </View>
            {selectedDate && (
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-lg bg-primary mr-1" />
                <Text className="text-xs text-gray-600 mr-2">Selected</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(BookingCalendar, (prevProps, nextProps) => {
  // Only re-render when these props change
  const selectedDateEqual = prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime();
  const minDateEqual = prevProps.minDate?.getTime() === nextProps.minDate?.getTime();
  const maxDateEqual = prevProps.maxDate?.getTime() === nextProps.maxDate?.getTime();
  const loadingEqual = prevProps.isLoading === nextProps.isLoading;
  
  // Check if availabilityData has changed
  const prevAvailCount = Object.values(prevProps.availabilityData || {}).filter(day => day.isAvailable).length;
  const nextAvailCount = Object.values(nextProps.availabilityData || {}).filter(day => day.isAvailable).length;
  
  const availabilityEqual = JSON.stringify(prevProps.availabilityData) === JSON.stringify(nextProps.availabilityData);
  
  // Only log when availability changes or is different from what we expect
  if (!availabilityEqual) {
    console.log(`[BookingCalendar Memo] Availability data changed:
      prevKeys: ${Object.keys(prevProps.availabilityData || {}).slice(0, 3).join(', ')}...
      nextKeys: ${Object.keys(nextProps.availabilityData || {}).slice(0, 3).join(', ')}...
      prev avail days: ${prevAvailCount}, next avail days: ${nextAvailCount}
    `);
  }
  
  console.log(`[BookingCalendar Memo] Checking equality:
    selectedDateEqual: ${selectedDateEqual}
    availabilityEqual: ${availabilityEqual}
    prev avail days: ${prevAvailCount}, next avail days: ${nextAvailCount}
    isLoading: prev=${prevProps.isLoading}, next=${nextProps.isLoading}
  `);
  
  // Skip re-render if all props are equal
  return selectedDateEqual && minDateEqual && maxDateEqual && loadingEqual && availabilityEqual;
});
