'use client';

import { useState, useEffect } from 'react';
import { Check, Flame, Target, TrendingUp, Plus, X, FileText, Lightbulb, Loader2 } from 'lucide-react';

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
    const [habits, setHabits] = useState<boolean[][]>(Array(90).fill(null).map(() => Array(3).fill(false)));
    const [todos, setTodos] = useState<Todo[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/productivity');
            const data = await res.json();
            
            // Map todos
            setTodos(data.todos.map((t: any) => ({
                id: t.id,
                text: t.text,
                completed: !!t.completed
            })));

            // Map notes
            setNotes(data.notes.map((n: any) => ({
                id: n.id,
                content: n.content,
                updatedAt: n.updated_at
            })));

            // Map habits
            if (data.habits && data.habits.length > 0) {
                const newHabits = Array(90).fill(null).map(() => Array(3).fill(false));
                data.habits.forEach((h: any) => {
                    try {
                        newHabits[h.day_index] = JSON.parse(h.status);
                    } catch (e) {
                        console.error('Failed to parse habit status', e);
                    }
                });
                setHabits(newHabits);
            }
        } catch (error) {
            console.error('Failed to fetch productivity data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const daysCompleted = habits.filter(day => day.some(h => h)).length;
    const currentStreak = calculateStreak(habits);
    const progress = Math.round((daysCompleted / 90) * 100);
    const currentPhase = daysCompleted < 30 ? 'Foundation' : daysCompleted < 60 ? 'Growth' : 'Scale';

    function calculateStreak(habits: boolean[][]) {
        let streak = 0;
        const today = new Date().getDate() - 1;
        for (let i = today; i >= 0; i--) {
            if (habits[i]?.some(h => h)) streak++;
            else if (i !== today) break;
        }
        return streak;
    }

    const toggleHabit = async (day: number, phaseIdx: number) => {
        const newHabitRow = [...habits[day]];
        newHabitRow[phaseIdx] = !newHabitRow[phaseIdx];
        
        const newHabits = [...habits];
        newHabits[day] = newHabitRow;
        setHabits(newHabits);

        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'habit',
                action: 'save',
                data: { day_index: day, status: JSON.stringify(newHabitRow) }
            })
        });
    };

    const addTodo = async () => {
        if (!newTodo.trim()) return;
        const todo = { id: Date.now().toString(), text: newTodo, completed: 0 };
        setTodos(prev => [{ ...todo, completed: false }, ...prev]);
        setNewTodo('');

        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'todo',
                action: 'save',
                data: todo
            })
        });
        fetchData();
    };

    const toggleTodo = async (id: string) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        
        const updatedTodo = { ...todo, completed: !todo.completed };
        setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));

        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'todo',
                action: 'save',
                data: { ...updatedTodo, completed: updatedTodo.completed ? 1 : 0 }
            })
        });
    };

    const deleteTodo = async (id: string) => {
        setTodos(prev => prev.filter(t => t.id !== id));
        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'todo',
                action: 'delete',
                data: { id }
            })
        });
    };

    const addNote = async () => {
        const id = Date.now().toString();
        const note = { id, content: '', updatedAt: new Date().toISOString() };
        setNotes(prev => [note, ...prev]);

        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'note',
                action: 'save',
                data: { id, content: '' }
            })
        });
    };

    const updateNote = async (id: string, content: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n));
        
        // Debounce or just save
        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'note',
                action: 'save',
                data: { id, content }
            })
        });
    };

    const deleteNote = async (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        await fetch('/api/productivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'note',
                action: 'delete',
                data: { id }
            })
        });
    };

    const getPhaseParams = (day: number) => {
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

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
        );
    }

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
                                <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: getPhaseParams(i * 30).color }}></div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{phase}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 2 }}>
                        {habits.map((dayHabits, dayIndex) => {
                            const phase = getPhaseParams(dayIndex);
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
                                    Last updated: {new Date(note.updatedAt).toLocaleDateString()}
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
