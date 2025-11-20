'use client';

import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, FileJson, ChevronRight, ChevronDown, X, ArrowUp, ArrowDown, Upload, MessageSquare, List, Hash } from 'lucide-react';

// --- Interfaces ---

export interface Material {
    topics: Topic[];
}

export interface Topic {
    id: string;
    title: string;
    subTopics: SubTopic[];
}

export interface SubTopic {
    id: string;
    title: string;
    scenes: Scene[];
}

export interface Scene {
    id: string;
    part: string;
    title: string;
    type: 'bubble' | 'points';
    bubbleText: string;
    points: string[];
}

// --- Helper to generate IDs ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Main Component ---

export default function MaterialGenerator() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [material, setMaterial] = useState<Material>({
        topics: [
            {
                id: "init-topic-1",
                title: "Topic 1",
                subTopics: [
                    {
                        id: "init-subtopic-1",
                        title: "Sub-topic 1",
                        scenes: [
                            {
                                id: "init-scene-1",
                                part: "init-scene-1",
                                title: "Introduction Scene",
                                type: 'bubble',
                                bubbleText: "Welcome to the course.",
                                points: []
                            }
                        ]
                    }
                ]
            }
        ]
    });

    // --- State Management Functions ---

    const updateTopic = (topicIndex: number, newTopic: Topic) => {
        const newTopics = [...material.topics];
        newTopics[topicIndex] = newTopic;
        setMaterial({ ...material, topics: newTopics });
    };

    const addTopic = () => {
        setMaterial({
            ...material,
            topics: [
                ...material.topics,
                { id: generateId(), title: "", subTopics: [] }
            ]
        });
    };

    const removeTopic = (index: number) => {
        const newTopics = material.topics.filter((_, i) => i !== index);
        setMaterial({ ...material, topics: newTopics });
    };

    const moveTopic = (index: number, direction: 'up' | 'down') => {
        const newTopics = [...material.topics];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newTopics.length) return;
        
        [newTopics[index], newTopics[targetIndex]] = [newTopics[targetIndex], newTopics[index]];
        setMaterial({ ...material, topics: newTopics });
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                
                // Validate basic structure
                if (!json.topics || !Array.isArray(json.topics)) {
                    alert("Invalid JSON format: Missing 'topics' array.");
                    return;
                }

                // Re-hydrate with IDs (since export strips them)
                const hydratedMaterial: Material = {
                    topics: json.topics.map((t: any) => ({
                        id: generateId(),
                        title: t.title || "",
                        subTopics: (t.subTopics || []).map((s: any) => ({
                            id: generateId(),
                            title: s.title || "",
                            scenes: (s.scenes || []).map((sc: any) => {
                                // Determine type based on data presence
                                const hasPoints = Array.isArray(sc.points) && sc.points.length > 0;
                                const hasBubble = !!sc.bubbleText;
                                // Default to bubble unless only points exist
                                const type = hasPoints && !hasBubble ? 'points' : 'bubble';
                                
                                // Generate ID for this scene
                                const newSceneId = generateId();

                                return {
                                    id: newSceneId,
                                    part: sc.part || newSceneId, // Use existing part or auto-generate ID
                                    title: sc.title || "",
                                    type: type,
                                    bubbleText: sc.bubbleText || "",
                                    points: sc.points || []
                                };
                            })
                        }))
                    }))
                };

                setMaterial(hydratedMaterial);
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to import JSON. Please checks the file format.");
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        event.target.value = '';
    };

    const downloadJson = () => {
        const cleanData = {
            topics: material.topics.map(({ id: tId, subTopics, ...tRest }) => ({
                ...tRest,
                subTopics: subTopics.map(({ id: sId, scenes, ...sRest }) => ({
                    ...sRest,
                    scenes: scenes.map(({ id: scId, type, bubbleText, points, title, ...scRest }) => ({
                        ...scRest,
                        // Only include title if it's not empty
                        ...(title ? { title } : {}),
                        // Only include the field relevant to the selected type
                        ...(type === 'bubble' ? { bubbleText } : {}),
                        ...(type === 'points' ? { points } : {})
                    }))
                }))
            }))
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "material_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Material Generator</h1>
                    <p className="text-slate-500 mt-1">Create nested Topics, SubTopics, and Scenes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleImport} 
                        className="hidden" 
                    />
                    <button
                        onClick={triggerImport}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-medium transition shadow-sm"
                    >
                        <Upload size={20} />
                        Import JSON
                    </button>
                    <button
                        onClick={downloadJson}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm"
                    >
                        <Save size={20} />
                        Download JSON
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Editor Column */}
                <div className="lg:col-span-2 space-y-8">
                    {material.topics.map((topic, index) => (
                        <TopicEditor
                            key={topic.id}
                            topic={topic}
                            index={index}
                            totalTopics={material.topics.length}
                            onChange={(t) => updateTopic(index, t)}
                            onDelete={() => removeTopic(index)}
                            onMove={(direction) => moveTopic(index, direction)}
                        />
                    ))}

                    <button
                        onClick={addTopic}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2 transition group"
                    >
                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                        Add New Topic
                    </button>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
                        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                            <FileJson size={18} className="text-indigo-400" />
                            <span className="text-slate-200 font-medium text-sm">Live Preview</span>
                        </div>
                        <div className="p-4 overflow-auto max-h-[calc(100vh-200px)] custom-scrollbar">
                            <pre className="text-xs md:text-sm font-mono text-emerald-400 whitespace-pre-wrap break-all">
                                {JSON.stringify(
                                    {
                                        topics: material.topics.map(({ id: tId, subTopics, ...tRest }) => ({
                                            ...tRest,
                                            subTopics: subTopics.map(({ id: sId, scenes, ...sRest }) => ({
                                                ...sRest,
                                                scenes: scenes.map(({ id: scId, type, bubbleText, points, title, ...scRest }) => ({
                                                    ...scRest,
                                                    ...(title ? { title } : {}),
                                                    ...(type === 'bubble' ? { bubbleText } : {}),
                                                    ...(type === 'points' ? { points } : {})
                                                }))
                                            }))
                                        }))
                                    },
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Sub-Components ---

interface TopicEditorProps {
    topic: Topic;
    index: number;
    totalTopics: number;
    onChange: (t: Topic) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

const TopicEditor = ({ topic, index, totalTopics, onChange, onDelete, onMove }: TopicEditorProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const updateSubTopic = (subIndex: number, newSub: SubTopic) => {
        const newSubs = [...topic.subTopics];
        newSubs[subIndex] = newSub;
        onChange({ ...topic, subTopics: newSubs });
    };

    const addSubTopic = () => {
        onChange({
            ...topic,
            subTopics: [...topic.subTopics, { id: generateId(), title: "", scenes: [] }]
        });
    };

    const removeSubTopic = (subIndex: number) => {
        const newSubs = topic.subTopics.filter((_, i) => i !== subIndex);
        onChange({ ...topic, subTopics: newSubs });
    };

    const moveSubTopic = (subIndex: number, direction: 'up' | 'down') => {
        const newSubs = [...topic.subTopics];
        const targetIndex = direction === 'up' ? subIndex - 1 : subIndex + 1;
        if (targetIndex < 0 || targetIndex >= newSubs.length) return;
        
        [newSubs[subIndex], newSubs[targetIndex]] = [newSubs[targetIndex], newSubs[subIndex]];
        onChange({ ...topic, subTopics: newSubs });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center gap-3">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-500 hover:text-slate-800">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Topic #{index + 1}</label>
                    <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => onChange({ ...topic, title: e.target.value })}
                        placeholder="Enter topic title..."
                        className="w-full bg-transparent text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded px-1 -ml-1"
                    />
                </div>
                
                {/* Move Controls */}
                <div className="flex items-center gap-1 mr-2">
                    <button 
                        onClick={() => onMove('up')} 
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ArrowUp size={18} />
                    </button>
                    <button 
                        onClick={() => onMove('down')} 
                        disabled={index === totalTopics - 1}
                        className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ArrowDown size={18} />
                    </button>
                </div>

                <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={18} />
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 bg-slate-50/50 space-y-6">
                    {topic.subTopics.map((sub, idx) => (
                        <SubTopicEditor
                            key={sub.id}
                            subTopic={sub}
                            index={idx}
                            totalSubTopics={topic.subTopics.length}
                            onChange={(s) => updateSubTopic(idx, s)}
                            onDelete={() => removeSubTopic(idx)}
                            onMove={(dir) => moveSubTopic(idx, dir)}
                        />
                    ))}
                    <div className="flex justify-end">
                        <button
                            onClick={addSubTopic}
                            className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition"
                        >
                            <Plus size={16} /> Add SubTopic
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SubTopicEditorProps {
    subTopic: SubTopic;
    index: number;
    totalSubTopics: number;
    onChange: (s: SubTopic) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

const SubTopicEditor = ({ subTopic, index, totalSubTopics, onChange, onDelete, onMove }: SubTopicEditorProps) => {
    const updateScene = (sceneIndex: number, newScene: Scene) => {
        const newScenes = [...subTopic.scenes];
        newScenes[sceneIndex] = newScene;
        onChange({ ...subTopic, scenes: newScenes });
    };

    const addScene = () => {
        const newId = generateId();
        onChange({
            ...subTopic,
            scenes: [...subTopic.scenes, { id: newId, part: newId, title: "", type: 'bubble', bubbleText: "", points: [] }]
        });
    };

    const removeScene = (sceneIndex: number) => {
        const newScenes = subTopic.scenes.filter((_, i) => i !== sceneIndex);
        onChange({ ...subTopic, scenes: newScenes });
    };

    const moveScene = (sceneIndex: number, direction: 'up' | 'down') => {
        const newScenes = [...subTopic.scenes];
        const targetIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
        if (targetIndex < 0 || targetIndex >= newScenes.length) return;
        
        [newScenes[sceneIndex], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[sceneIndex]];
        onChange({ ...subTopic, scenes: newScenes });
    };

    return (
        <div className="pl-4 border-l-4 border-indigo-200">
            <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-indigo-500 uppercase mb-1">SubTopic #{index + 1}</label>
                    <input
                        type="text"
                        value={subTopic.title}
                        onChange={(e) => onChange({ ...subTopic, title: e.target.value })}
                        placeholder="Enter sub-topic..."
                        className="w-full border-slate-300 border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* SubTopic Move Controls */}
                <div className="mt-6 flex items-center gap-0.5">
                    <button 
                        onClick={() => onMove('up')} 
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <button 
                        onClick={() => onMove('down')} 
                        disabled={index === totalSubTopics - 1}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ArrowDown size={16} />
                    </button>
                </div>

                <button onClick={onDelete} className="mt-6 p-2 text-slate-400 hover:text-red-600 transition">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="space-y-4">
                {subTopic.scenes.map((scene, idx) => (
                    <SceneEditor
                        key={scene.id}
                        scene={scene}
                        index={idx}
                        totalScenes={subTopic.scenes.length}
                        onChange={(s) => updateScene(idx, s)}
                        onDelete={() => removeScene(idx)}
                        onMove={(dir) => moveScene(idx, dir)}
                    />
                ))}
                <button
                    onClick={addScene}
                    className="w-full py-2 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-1 transition"
                >
                    <Plus size={14} /> Add Scene
                </button>
            </div>
        </div>
    );
};

interface SceneEditorProps {
    scene: Scene;
    index: number;
    totalScenes: number;
    onChange: (s: Scene) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

const SceneEditor = ({ scene, index, totalScenes, onChange, onDelete, onMove }: SceneEditorProps) => {
    
    const addPoint = () => {
        onChange({ ...scene, points: [...scene.points, ""] });
    };

    const updatePoint = (index: number, val: string) => {
        const newPoints = [...scene.points];
        newPoints[index] = val;
        onChange({ ...scene, points: newPoints });
    };

    const removePoint = (index: number) => {
        const newPoints = scene.points.filter((_, i) => i !== index);
        onChange({ ...scene, points: newPoints });
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
            {/* Scene ID Display */}
            <div className="absolute top-2 left-4 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition">
                 <Hash size={10} className="text-slate-400"/>
                 <span className="text-[10px] font-mono text-slate-400">{scene.part}</span>
            </div>

            {/* Scene Controls (Delete & Move) */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition bg-white shadow-sm rounded-md border border-slate-100 p-0.5">
                <button 
                    onClick={() => onMove('up')} 
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    title="Move Up"
                >
                    <ArrowUp size={14} />
                </button>
                <button 
                    onClick={() => onMove('down')} 
                    disabled={index === totalScenes - 1}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    title="Move Down"
                >
                    <ArrowDown size={14} />
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>
                <button 
                    onClick={onDelete} 
                    className="p-1 text-slate-300 hover:text-red-500"
                    title="Delete Scene"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="flex flex-col gap-4 mb-4 mt-4">
                {/* Scene Title Input */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Scene Title</label>
                    <input
                        type="text"
                        value={scene.title}
                        onChange={(e) => onChange({ ...scene, title: e.target.value })}
                        className="w-full border-slate-300 border rounded px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter scene title..."
                    />
                </div>
                
                {/* Type Selector */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Content Type</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onChange({ ...scene, type: 'bubble' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm transition ${
                                scene.type === 'bubble' 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <MessageSquare size={16} />
                            Bubble Text
                        </button>
                        <button
                            onClick={() => onChange({ ...scene, type: 'points' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm transition ${
                                scene.type === 'points' 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <List size={16} />
                            Points
                        </button>
                    </div>
                </div>

                {/* Conditional Input Rendering */}
                {scene.type === 'bubble' ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Bubble Text</label>
                        <textarea
                            value={scene.bubbleText}
                            onChange={(e) => onChange({ ...scene, bubbleText: e.target.value })}
                            className="w-full border-slate-300 border rounded px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] resize-y"
                            placeholder="Enter dialogue..."
                            rows={3}
                        />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-slate-500">Points List</label>
                            <button 
                                onClick={addPoint}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1 transition"
                            >
                                <Plus size={10} /> Add Point
                            </button>
                        </div>
                        <div className="space-y-2">
                            {scene.points.map((point, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 select-none">•</span>
                                    <input
                                        type="text"
                                        value={point}
                                        onChange={(e) => updatePoint(idx, e.target.value)}
                                        className="flex-1 border-b border-slate-200 focus:border-indigo-500 bg-transparent text-sm px-1 py-0.5 focus:outline-none transition"
                                        placeholder="Enter point..."
                                    />
                                    <button onClick={() => removePoint(idx)} className="text-slate-300 hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {scene.points.length === 0 && (
                                <div className="text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400">No points added yet.</p>
                                    <button onClick={addPoint} className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 font-medium">
                                        + Add first point
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};