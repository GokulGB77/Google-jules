import React, { useState, useEffect } from 'react';
import { format, startOfDay, differenceInDays, subDays, addDays, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Plus, Check, Calendar, BarChart3, Moon, Sun, Trash2, Target, Flame } from 'lucide-react';
import './App.css';

// Helper functions for localStorage
const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const loadFromStorage = (key, defaultValue = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Calculate streak for a habit
const calculateStreak = (habit, completions) => {
  const today = startOfDay(new Date());
  let streak = 0;
  let currentDate = today;
  
  while (true) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const completion = completions.find(c => c.habitId === habit.id && c.date === dateKey);
    
    if (completion && completion.completed) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else if (streak === 0 && isToday(currentDate)) {
      // If today is not completed yet, check yesterday
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Main App Component
function App() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#3B82F6');
  const [currentView, setCurrentView] = useState('today'); // 'today', 'calendar', 'stats'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // Color options for habits
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Load data on component mount
  useEffect(() => {
    const savedHabits = loadFromStorage('habits', []);
    const savedCompletions = loadFromStorage('completions', []);
    const savedTheme = loadFromStorage('theme', 'light');
    
    setHabits(savedHabits);
    setCompletions(savedCompletions);
    setIsDarkMode(savedTheme === 'dark');
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Save habits when they change
  useEffect(() => {
    saveToStorage('habits', habits);
  }, [habits]);

  // Save completions when they change
  useEffect(() => {
    saveToStorage('completions', completions);
  }, [completions]);

  // Save theme preference
  useEffect(() => {
    saveToStorage('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Add new habit
  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        color: newHabitColor,
        createdAt: new Date().toISOString()
      };
      setHabits([...habits, newHabit]);
      setNewHabitName('');
    }
  };

  // Delete habit
  const deleteHabit = (habitId) => {
    setHabits(habits.filter(h => h.id !== habitId));
    setCompletions(completions.filter(c => c.habitId !== habitId));
  };

  // Toggle habit completion
  const toggleHabitCompletion = (habitId, date = new Date()) => {
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
    const existingCompletion = completions.find(
      c => c.habitId === habitId && c.date === dateKey
    );

    if (existingCompletion) {
      setCompletions(completions.map(c => 
        c.habitId === habitId && c.date === dateKey
          ? { ...c, completed: !c.completed }
          : c
      ));
    } else {
      setCompletions([...completions, {
        id: Date.now().toString(),
        habitId,
        date: dateKey,
        completed: true
      }]);
    }
  };

  // Check if habit is completed on a specific date
  const isHabitCompleted = (habitId, date) => {
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
    const completion = completions.find(c => c.habitId === habitId && c.date === dateKey);
    return completion && completion.completed;
  };

  // Get week days for calendar view
  const getWeekDays = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  // Calculate completion rate for a habit
  const getCompletionRate = (habit) => {
    const daysElapsed = Math.max(1, differenceInDays(new Date(), new Date(habit.createdAt)) + 1);
    const completedDays = completions.filter(c => c.habitId === habit.id && c.completed).length;
    return Math.round((completedDays / daysElapsed) * 100);
  };

  // Today View Component
  const TodayView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Today's Habits
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {habits.filter(h => isHabitCompleted(h.id, new Date())).length}/{habits.length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {habits.map(habit => {
          const isCompleted = isHabitCompleted(habit.id, new Date());
          const streak = calculateStreak(habit, completions);
          
          return (
            <div
              key={habit.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <button
                onClick={() => toggleHabitCompletion(habit.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {isCompleted && <Check className="w-4 h-4" />}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {habit.name}
                  </span>
                </div>
              </div>
              
              {streak > 0 && (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{streak}</span>
                </div>
              )}
              
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No habits yet. Add your first habit to get started!</p>
        </div>
      )}
    </div>
  );

  // Calendar View Component
  const CalendarView = () => {
    const weekDays = getWeekDays(selectedWeek);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar View</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWeek(subDays(selectedWeek, 7))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px] text-center">
              {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
            </span>
            <button
              onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Habit</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="p-3 text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Habits */}
          {habits.map(habit => (
            <div key={habit.id} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="p-3 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {habit.name}
                </span>
              </div>
              {weekDays.map(day => {
                const isCompleted = isHabitCompleted(habit.id, day);
                return (
                  <div key={day.toISOString()} className="p-3 flex items-center justify-center">
                    <button
                      onClick={() => toggleHabitCompletion(habit.id, day)}
                      className={`w-6 h-6 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      {isCompleted && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {habits.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Add some habits to see your calendar view!</p>
          </div>
        )}
      </div>
    );
  };

  // Stats View Component
  const StatsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map(habit => {
          const streak = calculateStreak(habit, completions);
          const completionRate = getCompletionRate(habit);
          const totalCompletions = completions.filter(c => c.habitId === habit.id && c.completed).length;
          
          return (
            <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Streak</span>
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Flame className="w-4 h-4" />
                    <span className="font-medium">{streak} days</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="font-medium text-gray-900 dark:text-white">{completionRate}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Completions</span>
                  <span className="font-medium text-gray-900 dark:text-white">{totalCompletions}</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: habit.color, 
                      width: `${completionRate}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Add some habits to see your statistics!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Habit Tracker</h1>
            <p className="text-gray-600 dark:text-gray-400">Build better habits, one day at a time</p>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Add Habit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Add a new habit..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setNewHabitColor(color)}
                  className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                    newHabitColor === color ? 'ring-2 ring-gray-400 dark:ring-gray-300 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            <button
              onClick={addHabit}
              disabled={!newHabitName.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-1 mb-8 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
          {[
            { key: 'today', label: 'Today', icon: Check },
            { key: 'calendar', label: 'Calendar', icon: Calendar },
            { key: 'stats', label: 'Stats', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                currentView === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="min-h-[400px]">
          {currentView === 'today' && <TodayView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'stats' && <StatsView />}
        </div>
      </div>
    </div>
  );
}

export default App;