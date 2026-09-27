'use client';
import { createContext, useContext } from 'react';
import { onboardingDataset } from '@/lib/metis/datasets';
const ExperimentDataContext=createContext(onboardingDataset);
export const ExperimentDataProvider=ExperimentDataContext.Provider;
export const useExperimentData=()=>useContext(ExperimentDataContext);
