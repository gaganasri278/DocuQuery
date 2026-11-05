import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  HelpCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Lightbulb
} from 'lucide-react';
import { DocumentItem, MCQItem, FlashcardItem } from '../types';
import { api } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudyAssistantViewProps {
  documents: DocumentItem[];
}

export const StudyAssistantView: React.FC<StudyAssistantViewProps> = ({ documents }) => {
  const [subTab, setSubTab] = useState<'mcq' | 'flashcards' | 'explain'>('mcq');
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');

  // Keep selectedDocId synchronized with documents list
  useEffect(() => {
    if ((!selectedDocId || !documents.some(d => d.id === selectedDocId)) && documents.length > 0) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  // MCQ State
  const [mcqDifficulty, setMcqDifficulty] = useState<string>('medium');
  const [mcqCount, setMcqCount] = useState<number>(5);
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isGeneratingMCQ, setIsGeneratingMCQ] = useState<boolean>(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<boolean>(false);

  // Concept Simplifier State
  const [conceptInput, setConceptInput] = useState<string>('');
  const [explainLevel, setExplainLevel] = useState<string>('beginner');
  const [conceptExplanation, setConceptExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Generate MCQs
  const handleGenerateMCQs = async () => {
    if (!selectedDocId) {
      alert('Please upload and select a document first.');
      return;
    }
    setIsGeneratingMCQ(true);
    setSelectedAnswers({});
    setShowExplanation({});
    try {
      const items = await api.generateMCQs(selectedDocId, mcqDifficulty, mcqCount);
      setMcqs(items);
    } catch (err: any) {
      alert(`Failed to generate quiz: ${err.message}`);
    } finally {
      setIsGeneratingMCQ(false);
    }
  };

  // Generate Flashcards
  const handleGenerateFlashcards = async () => {
    if (!selectedDocId) {
      alert('Please upload and select a document first.');
      return;
    }
    setIsGeneratingFlashcards(true);
    setCardIndex(0);
    setIsFlipped(false);
    try {
      const cards = await api.generateFlashcards(selectedDocId, 6);
      setFlashcards(cards);
    } catch (err: any) {
      alert(`Failed to generate flashcards: ${err.message}`);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Explain Concept
  const handleExplainConcept = async () => {
    if (!conceptInput.trim()) return;
    setIsExplaining(true);
    setConceptExplanation('');
    try {
      const res = await api.explainConcept(
        conceptInput.trim(),
        explainLevel,
        selectedDocId || undefined
      );
      setConceptExplanation(res.explanation);
    } catch (err: any) {
      alert(`Failed to explain concept: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSelectOption = (questionId: number, optionLetter: string) => {
    if (selectedAnswers[questionId]) return; // already answered
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionLetter }));
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
  };

  const calculateScore = () => {
    let correct = 0;
    mcqs.forEach(q => {
      const chosen = selectedAnswers[q.id];
      const correctClean = q.correct_answer.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (chosen && chosen === correctClean) {
        correct++;
      }
    });
    return { correct, total: mcqs.length };
  };

  const currentCard = flashcards[cardIndex];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Sub-Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Study Assistant</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active recall quizzes, 3D interactive flashcards, and plain-English concept simplification.
            </p>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
            <button
              onClick={() => setSubTab('mcq')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                subTab === 'mcq'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>MCQ Quiz</span>
            </button>
            <button
              onClick={() => setSubTab('flashcards')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                subTab === 'flashcards'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => setSubTab('explain')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                subTab === 'explain'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Concept Simplifier</span>
            </button>
          </div>
        </div>

        {/* Document Selector Header */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target Document:</span>
            {documents.length > 0 ? (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.chunk_count} chunks)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                No documents uploaded. Please upload a PDF, DOCX, or TXT file first.
              </span>
            )}
          </div>
        </div>

        {/* TAB 1: MCQ Practice Quiz */}
        {subTab === 'mcq' && (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Difficulty:</span>
                  <select
                    value={mcqDifficulty}
                    onChange={(e) => setMcqDifficulty(e.target.value)}
                    className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                  >
                    <option value="easy">Easy (Recall)</option>
                    <option value="medium">Medium (Application)</option>
                    <option value="hard">Hard (Analysis)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Questions:</span>
                  <select
                    value={mcqCount}
                    onChange={(e) => setMcqCount(Number(e.target.value))}
                    className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateMCQs}
                disabled={isGeneratingMCQ || documents.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition flex items-center gap-2 shadow-sm"
              >
                {isGeneratingMCQ ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing & Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Practice Quiz</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Score Banner */}
            {mcqs.length > 0 && Object.keys(selectedAnswers).length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Live Score: {calculateScore().correct} of {calculateScore().total} Correct ({Math.round((calculateScore().correct / calculateScore().total) * 100)}%)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setShowExplanation({});
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Answers</span>
                </button>
              </div>
            )}

            {/* Questions List */}
            {mcqs.length === 0 && !isGeneratingMCQ ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-10 h-10 text-indigo-400 mx-auto mb-3 opacity-60" />
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Ready to test your knowledge?
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Select your difficulty level and click "Generate Practice Quiz" to create instant multiple choice questions from your document.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {mcqs.map((q, qIndex) => {
                  const userAnswer = selectedAnswers[q.id];
                  const hasAnswered = !!userAnswer;
                  const correctClean = q.correct_answer.replace(/[^A-Za-z]/g, '').toUpperCase();

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white leading-relaxed">
                          {qIndex + 1}. {q.question}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {q.difficulty}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const letterMatch = opt.match(/^([A-Da-d])[\.:\s]/);
                          const letter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + optIdx);
                          const isSelected = userAnswer === letter;
                          const isCorrect = letter === correctClean;

                          let btnStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600';

                          if (hasAnswered) {
                            if (isCorrect) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
                            } else {
                              btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, letter)}
                              disabled={hasAnswered}
                              className={`p-3 rounded-xl border text-left text-xs transition flex items-start gap-2.5 ${btnStyle}`}
                            >
                              <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs border border-slate-200 dark:border-slate-600">
                                {letter}
                              </span>
                              <span className="flex-1 mt-0.5">{opt.replace(/^[A-Da-d][\.:\s]\s*/, '')}</span>
                              {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                              {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {hasAnswered && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pedagogical Explanation:</span>
                          </span>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 3D Flip Flashcards */}
        {subTab === 'flashcards' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Generate high-yield revision flashcards with terms, equations, and concise answers.
              </span>
              <button
                onClick={handleGenerateFlashcards}
                disabled={isGeneratingFlashcards || documents.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition flex items-center gap-2 shadow-sm"
              >
                {isGeneratingFlashcards ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Concepts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>

            {flashcards.length === 0 && !isGeneratingFlashcards ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                <Layers className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-60" />
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Interactive Flashcard Deck
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Click "Generate Flashcards" above to build an interactive 3D revision deck.
                </p>
              </div>
            ) : currentCard ? (
              <div className="max-w-xl mx-auto space-y-4">
                {/* 3D Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="cursor-pointer group select-none min-h-[260px] p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                      {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
                    </span>
                    <span>
                      Card {cardIndex + 1} of {flashcards.length}
                    </span>
                  </div>

                  <div className="py-6 text-center">
                    <h3 className={`font-semibold leading-relaxed transition ${
                      isFlipped
                        ? 'text-base sm:text-lg text-slate-800 dark:text-slate-200 font-normal'
                        : 'text-lg sm:text-xl text-slate-900 dark:text-white'
                    }`}>
                      {isFlipped ? currentCard.back : currentCard.front}
                    </h3>
                  </div>

                  <div className="text-center text-[11px] text-slate-400 italic">
                    (Click anywhere on card to flip)
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((cardIndex - 1 + flashcards.length) % flashcards.length);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Previous Card"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    {isFlipped ? 'Show Front' : 'Flip to Answer'}
                  </button>

                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((cardIndex + 1) % flashcards.length);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Next Card"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: Concept Simplifier ("Explain like I'm 5") */}
        {subTab === 'explain' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Concept or Term to Demystify:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                    placeholder="e.g. Cosine Distance, Vector Embeddings, Primary Keys, Latency..."
                    className="flex-1 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleExplainConcept()}
                  />
                  <select
                    value={explainLevel}
                    onChange={(e) => setExplainLevel(e.target.value)}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <option value="beginner">Beginner (ELI5 Analogy)</option>
                    <option value="intermediate">Intermediate (Clear & Precise)</option>
                    <option value="advanced">Advanced (Deep Technical)</option>
                  </select>
                  <button
                    onClick={handleExplainConcept}
                    disabled={isExplaining || !conceptInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isExplaining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Explain</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Explanation Result */}
            {conceptExplanation && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                    Concept Breakdown: {conceptInput} ({explainLevel})
                  </span>
                </div>
                <MarkdownRenderer content={conceptExplanation} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
