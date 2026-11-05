import { createContext, useContext, useState } from 'react';

const StudyPlanContext = createContext(null);

export function StudyPlanProvider({ children }) {
  const [selectedSteps, setSelectedSteps] = useState([]);

  function toggleStep(step) {
    setSelectedSteps((currentSteps) => {
      const alreadySelected = currentSteps.some((entry) => entry.id === step.id);

      if (alreadySelected) {
        return currentSteps.filter((entry) => entry.id !== step.id);
      }

      return [...currentSteps, step];
    });
  }

  function removeStep(id) {
    setSelectedSteps((currentSteps) => currentSteps.filter((step) => step.id !== id));
  }

  const value = { selectedSteps, toggleStep, removeStep };

  return <StudyPlanContext value={value}>{children}</StudyPlanContext>;
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);

  if (!context) {
    throw new Error('useStudyPlan must be used inside StudyPlanProvider');
  }

  return context;
}
