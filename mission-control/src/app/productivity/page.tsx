'use client';

import { useState, useEffect } from 'react';
import { Check, Flame, Target, TrendingUp, Plus, X, FileText, Lightbulb } from 'lucide-react';

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

interface Note {
    id: string;
    content: string;
    updatedAt: string;
}

const motivationalMessages = [
    "Every expert was once a beginner. Let's get started! 🚀",
    "The journey of a thousand miles begins with a single step.",
    "Small consistent actions lead to massive results.",
    "You're building something great. Keep going! 💪",
    "Progress, not perfection. Every day counts.",
    "Your future self will thank you for doing this today.",
    "Discipline is choosing between what you want now and what you want most.",
    "Halfway there! Your dedication is showing.",
    "Almost at the finish line! Push through! 🎯",
    "Congratulations! You've completed an incredible journey! 🏆"
];

export default function ProductivityPage() {
    // Stats (mock data)
    const daysCompleted = 45;
    const currentStreak = 7;
    const currentPhase = 'Growth';
    const progress = Math.round((daysCompleted / 90) * 100);

    // Habit tracker
    const [habits, setHabits] = useState<boolean[][]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('habits');
            if (saved) return JSON.parse(saved);
        }
        // Initialize with empty 90 days
        return Array(90).fill(null).map(() => Array(3).fill(false));
    });

    // Todos
    const [todos, setTodos] = useState<Todo[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('todos');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: '1', text: 'Review agent performance metrics', completed: true },
            { id: '2', text: 'Update system prompt for better context', completed: false },
            { id: '3', text: 'Test new tool integration', completed: false },
        ];
    });
    const [newTodo, setNewTodo] = useState('');

    // Notes
    const [notes, setNotes] = useState<Note[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('notes');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: '1', content: 'Key insight: User prefers concise responses in the morning.', updatedAt: '2026-03-05' },
        ];
    });

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('habits', JSON.stringify(habits));
    }, [habits]);

    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos));
    }, [todos]);

    useEffect(() => {
        localStorage.setItem('notes', JSON.stringify(notes));
    }, [notes]);

    const toggleHabit = (day: number, phase: number) => {
        setHabits(prev => {
            const newHabits = [...prev];
            newHabits[day] = [...newHabits[day]];
            newHabits[day][phase] = !newHabits[day][phase];
            return newHabits;
        });
    };

    const addTodo = () => {
        if (!newTodo.trim()) return;
        setTodos(prev => [...prev, { id: Date.now().toString(), text: newTodo, completed: false }]);
        setNewTodo('');
    };

    const toggleTodo = (id: string) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = (id: string) => {
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    const addNote = () => {
        setNotes(prev => [...prev, { id: Date.now().toString(), content: '', updatedAt: new Date().toISOString().split('T')[0] }]);
    };

    const updateNote = (id: string, content: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content, updatedAt: new Date().toISOString().split('T')[0] } : n));
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const getPhase = (day: number) => {
        if (day < 30) return { name: 'Foundation', color: 'var(--brand-blue)' };
        if (day < 60) return { name: 'Growth', color: 'var(--brand-green)' };
        return { name: 'Scale', color: 'var(--brand-orange)' };
    };

    const getMessage = () => {
        if (progress < 10) return motivationalMessages[0];
        if (progress < 25) return motivationalMessages[1];
        if (progress < 40) return motivationalMessages[2];
        if (progress < 55) return motivationalMessages[3];
        if (progress < 70) return motivationalMessages[4];
        if (progress < 80) return motivationalMessages[5];
        if (progress < 90) return motivationalMessages[6];
        if (progress < 95) return motivationalMessages[7];
        if (progress < 100) return motivationalMessages[8];
        return motivationalMessages[9];
    };

    const today = new Date().getDate() - 1;

    return (
        <div className="page">
            <div className="page-header fade-in">
                <h1 className="page-title">Productivity</h1>
                <p className="page-subtitle">Track your habits and stay focused</p>
            </div>

            {/* Stat Cards */}
            <div className="grid-4 fade-in fade-in-delay-1">
                <div className="stat-card">
                    <div className="stat-value">{daysCompleted}</div>
                    <div className="stat-label">Days Completed</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flame size={28} color="var(--brand-blue)" />
                        {currentStreak}
                    </div>
                    <div className="stat-label">Current Streak</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-value">{currentPhase}</div>
                    <div className="stat-label">Current Phase</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-value">{progress}%</div>
                    <div className="stat-label">Overall Progress</div>
                </div>
            </div>

            {/* Motivational Message */}
            <div className="card fade-in fade-in-delay-2" style={{ marginTop: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <Lightbulb size={24} color="var(--brand-orange)" />
                    <p style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{getMessage()}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
                {/* 90-Day Habit Tracker */}
                <div className="card fade-in fade-in-delay-3">
                    <div className="card-header">
                        <h3 className="card-title">90-Day Habit Tracker</h3>
                    </div>

                    {/* Phase Labels */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        {['Foundation', 'Growth', 'Scale'].map((phase, i) => (
                            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: getPhase(i * 30).color }}></div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{phase}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 2 }}>
                        {habits.map((dayHabits, dayIndex) => {
                            const phase = getPhase(dayIndex);
                            const isToday = dayIndex === today;
                            const isDone = dayHabits.some(h => h);

                            return (
                                <div
                                    key={dayIndex}
                                    onClick={() => toggleHabit(dayIndex, 0)}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: isDone
                                            ? phase.color
                                            : isToday
                                                ? 'var(--brand-blue-dim)'
                                                : 'var(--bg-elevated)',
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        border: isToday ? `1px solid ${phase.color}` : 'none',
                                        transition: 'all var(--transition-fast)',
                                    }}
                                    title={`Day ${dayIndex + 1} - ${phase.name}`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Quick Todos */}
                <div className="card fade-in fade-in-delay-4">
                    <div className="card-header">
                        <h3 className="card-title">Quick Todos</h3>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                        <input
                            className="input"
                            placeholder="Add a new task..."
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                        />
                        <button className="btn btn-primary" onClick={addTodo}>
                            <Plus size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {todos.map(todo => (
                            <div
                                key={todo.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    padding: 'var(--space-sm)',
                                    backgroundColor: 'var(--bg-input)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <button
                                    onClick={() => toggleTodo(todo.id)}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        border: todo.completed ? 'none' : '2px solid var(--border-default)',
                                        backgroundColor: todo.completed ? 'var(--brand-green)' : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {todo.completed && <Check size={12} color="white" />}
                                </button>
                                <span style={{
                                    flex: 1,
                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                    color: todo.completed ? 'var(--text-disabled)' : 'var(--text-primary)',
                                }}>
                                    {todo.text}
                                </span>
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="card fade-in" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FileText size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Notes
                    </h3>
                    <button className="btn btn-secondary" onClick={addNote}>
                        <Plus size={16} />
                        Add Note
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {notes.map(note => (
                        <div
                            key={note.id}
                            style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        >
                            <textarea
                                className="textarea"
                                value={note.content}
                                onChange={(e) => updateNote(note.id, e.target.value)}
                                placeholder="Write your note here..."
                                style={{ minHeight: 80, marginBottom: 'var(--space-sm)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>
                                    Last updated: {note.updatedAt}
                                </span>
                                <button
                                    onClick={() => deleteNote(note.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
