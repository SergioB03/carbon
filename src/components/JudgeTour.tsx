import React, { useState } from 'react';
import { useAppState } from '../state/appState';
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Layers, CheckCircle2, Award, Play } from 'lucide-react';

interface TourStep {
  title: string;
  badge: string;
  description: string;
  actionText: string;
  view: 'overview' | 'suppliers' | 'simulator' | 'evidence';
  material: 'all' | 'steel' | 'aluminium' | 'cement';
  setup?: (state: any) => void;
  visualHighlight: string;
}

export default function JudgeTour() {
  const state = useAppState();
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Guided Steps designed to show the "Wow" factors to a hackathon judge in under 2 minutes
  const steps: TourStep[] = [
    {
      title: "Accruing CBAM Ledger & Material Lens",
      badge: "STEP 1 OF 4 / INITIAL INSIGHT",
      description: "We are viewing the entire EU importer ledger. Notice our custom geometric accent shapes and frosted glass containers. Click the Material buttons in the sidebar or below to watch all KPI states, charts, and table entries dynamically recalculate on the fly.",
      actionText: "Recalculate Steel Divergences",
      view: 'overview',
      material: 'all',
      setup: (s) => {
        s.setView('overview');
        s.setMaterial('all');
      },
      visualHighlight: "Sidebar Material Lens & Overview Dashboard"
    },
    {
      title: "The Heart of the App: Satellite Divergence Flagged",
      badge: "STEP 2 OF 4 / TRIAGE RISK CONTROLS",
      description: "Let's switch to the Suppliers database. Here we audit self-declarations against physical space satellite observations. Drag the sliding Risk Sensitivity Bar—as the tolerance narrows, priority alerts trigger instantly to flag direct-estimate divergence.",
      actionText: "Tighten Sensitivity to 12%",
      view: 'suppliers',
      material: 'steel',
      setup: (s) => {
        s.setView('suppliers');
        s.setMaterial('steel');
        s.setDivergenceThreshold(0.12);
      },
      visualHighlight: "Risk Parameter Threshold Slider & Alarm Fields"
    },
    {
      title: "Terrestrial Grid & Radar Satellite Mapping",
      badge: "STEP 3 OF 4 / SPATIAL RADAR",
      description: "We locate manufacturing routes via global coordinate tracking linked directly to the Rotterdam terminal. Selecting POSCO or Vedanta draws physical pathways on the radar grid and measures the confidence ratio of our automated space-based audits.",
      actionText: "Focus Radar Mapping",
      view: 'overview', // This has FacilityMap integrated!
      material: 'aluminium',
      setup: (s) => {
        s.setView('overview');
        s.setMaterial('aluminium');
      },
      visualHighlight: "Geographic Trace Scrutiny Coordinates"
    },
    {
      title: "Model Future Carbon Payoffs & Tax Avoidance",
      badge: "STEP 4 OF 4 / SIMULATOR ENGINE",
      description: "How does a company bypass costly default tariffs? Model custom factory retrofits (e.g. switching to bio-fuels or carbon capture). Slide the factory intensities down and visualize instant rank changes and cash payback drops projected for 2030.",
      actionText: "Open Carbon Payoffs Simulator",
      view: 'simulator',
      material: 'all',
      setup: (s) => {
        s.setView('simulator');
        s.setMaterial('all');
      },
      visualHighlight: "What-If Intensity Modulator Sliders"
    }
  ];

  const handleNext = () => {
    const nextIdx = (currentStep + 1) % steps.length;
    setCurrentStep(nextIdx);
    const nextStep = steps[nextIdx];
    if (nextStep.setup) {
      nextStep.setup(state);
    } else {
      state.setView(nextStep.view);
      state.setMaterial(nextStep.material);
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentStep - 1 + steps.length) % steps.length;
    setCurrentStep(prevIdx);
    const prevStep = steps[prevIdx];
    if (prevStep.setup) {
      prevStep.setup(state);
    } else {
      state.setView(prevStep.view);
      state.setMaterial(prevStep.material);
    }
  };

  const triggerStepSetup = () => {
    const step = steps[currentStep];
    if (step.setup) {
      step.setup(state);
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={() => {
          setIsActive(true);
          triggerStepSetup();
        }}
        className="fixed bottom-6 left-6 z-100 backdrop-blur-xl bg-gradient-to-r from-stone-900 via-[#115E59] to-stone-950 text-white px-5 py-3 rounded-full flex items-center gap-2.5 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.03] cursor-pointer ring-1 ring-white/20"
      >
        <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        <span className="font-sans text-xs font-semibold tracking-wide">Launch Guided Pitch Tour</span>
      </button>
    );
  }

  const step = steps[currentStep];

  return (
    <div 
      id="judge-tour-guided-widget"
      className="fixed bottom-6 left-6 z-100 max-w-[420px] backdrop-blur-2xl bg-white/80 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-6 rounded-3xl transition-all duration-300 animate-fade-in flex flex-col gap-4 text-left"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-stone-200/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#2E4A3F]/10 p-1.5 rounded-full">
            <Award className="w-4.5 h-4.5 text-[#2E4A3F]" />
          </div>
          <div>
            <h4 className="font-sans text-xs uppercase font-bold tracking-widest text-[#2E4A3F] leading-none">
              Judge Guided Tour
            </h4>
            <span className="font-mono text-[8.5px] text-stone-400 block mt-1 uppercase font-medium">
              Carbon Bridge Presentation Playbook
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsActive(false)}
          className="text-stone-400 hover:text-stone-700 text-xs font-mono px-2 py-1 bg-stone-200/40 rounded-full cursor-pointer transition-all hover:bg-stone-200/70"
        >
          Hide Tour
        </button>
      </div>

      {/* Step Body */}
      <div className="space-y-2">
        <span className="font-mono text-[9px] font-bold text-emerald-800 tracking-wider block bg-emerald-500/10 px-2 py-0.5 rounded-full w-max">
          {step.badge}
        </span>
        <h3 className="font-sans text-base font-semibold text-stone-900 tracking-tight leading-snug">
          {step.title}
        </h3>
        <p className="text-[11.5px] text-stone-600 font-sans leading-relaxed font-light">
          {step.description}
        </p>
        <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono font-medium text-stone-400 bg-stone-100/50 p-2 rounded-xl border border-stone-200/20">
          <span className="text-stone-450 uppercase text-[8.5px]">Focus Target:</span>
          <span className="text-[#b24c30]">{step.visualHighlight}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Progress indicator dots */}
        <div className="flex gap-1.5">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-4 bg-[#2E4A3F]' : 'w-1.5 bg-stone-200'}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="p-2 border border-stone-300/65 hover:border-stone-500 rounded-full cursor-pointer transition-all hover:bg-white text-stone-650"
              title="Previous Step"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-[#F5F5F7] rounded-all flex items-center gap-1.5 md:gap-2 text-[11px] font-mono font-medium rounded-full cursor-pointer transition-all shadow-xs"
          >
            <span>{currentStep === steps.length - 1 ? "Repeat Tour" : "Next Playbook Step"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
