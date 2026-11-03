// context is basically shared state. I can wrap some component children in context, and they'll have access to
// that shared state.
// REMINDER: functions (e.g. modern React components) don't store externally accessible persistent state like classes with attributes
//           -> they're just functions; that's why you see so many hook-like things: it's outsourcing where persistent state needs to be stored

import { createContext, useContext } from 'react';


const StudyPlanContext = createContext(null);  
// setting default value to null so hook will be able to detect missing provider
// see: useStudyPlan below


export function StudyPlanProvider({ children }) {
  // the behaviour I want to deliver with context is:
  //  - where the data is stored (obvs, but also:)
  //  - how the data is supposed to be manipulated (toggle, remove)
  const value = {
    // we'll replace these with actual logic later
    selectedSteps: [],
    toggleStep: () => { console.log('toggled step'); },
    removeStep: () => {},
  };

  // it's like saran-wrapping a bunch of components in a shared state/logic provider
  return <StudyPlanContext value={value}>{children}</StudyPlanContext>
}


export function useStudyPlan() {
  // the context provider needs to wrap (in component hierarchy) anything using this hook
  // but, anything using this hook will have access to shared state/behaviour
  const context = useContext(StudyPlanContext);
  
  if (!context) {
    throw new Error('context: useStudyPlan must be used inside StudyPlanProvider')
  }

  return context;
}