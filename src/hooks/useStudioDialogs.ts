/**
 * useStudioDialogs - Centralized dialog state management for Studio
 * 
 * Manages all studio dialogs: Trim, VocalReplacement, ArrangementReplacement,
 * Remix, Extend, SectionReplacement
 */

import { useState, useCallback } from 'react';

export type StudioDialogType = 
  | 'trim'
  | 'vocalReplacement'
  | 'arrangementReplacement'
  | 'remix'
  | 'extend'
  | 'sectionReplacement'
  | 'stemSeparation';

interface UseStudioDialogsReturn {
  // Individual dialog states
  showTrimDialog: boolean;
  showVocalReplacementDialog: boolean;
  showArrangementReplacementDialog: boolean;
  showRemixDialog: boolean;
  showExtendDialog: boolean;
  showSectionReplacementDialog: boolean;
  showStemSeparationDialog: boolean;
  
  // Generic open/close
  openDialog: (type: StudioDialogType) => void;
  closeDialog: (type: StudioDialogType) => void;
  toggleDialog: (type: StudioDialogType) => void;
  
  // Individual setters for direct use
  setShowTrimDialog: (show: boolean) => void;
  setShowVocalReplacementDialog: (show: boolean) => void;
  setShowArrangementReplacementDialog: (show: boolean) => void;
  setShowRemixDialog: (show: boolean) => void;
  setShowExtendDialog: (show: boolean) => void;
  setShowSectionReplacementDialog: (show: boolean) => void;
  setShowStemSeparationDialog: (show: boolean) => void;
  
  // Close all dialogs
  closeAllDialogs: () => void;
}

export function useStudioDialogs(): UseStudioDialogsReturn {
  const [showTrimDialog, setShowTrimDialog] = useState(false);
  const [showVocalReplacementDialog, setShowVocalReplacementDialog] = useState(false);
  const [showArrangementReplacementDialog, setShowArrangementReplacementDialog] = useState(false);
  const [showRemixDialog, setShowRemixDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showSectionReplacementDialog, setShowSectionReplacementDialog] = useState(false);
  const [showStemSeparationDialog, setShowStemSeparationDialog] = useState(false);

  const getDialogSetter = useCallback((type: StudioDialogType) => {
    switch (type) {
      case 'trim':
        return setShowTrimDialog;
      case 'vocalReplacement':
        return setShowVocalReplacementDialog;
      case 'arrangementReplacement':
        return setShowArrangementReplacementDialog;
      case 'remix':
        return setShowRemixDialog;
      case 'extend':
        return setShowExtendDialog;
      case 'sectionReplacement':
        return setShowSectionReplacementDialog;
      case 'stemSeparation':
        return setShowStemSeparationDialog;
      default:
        return () => {};
    }
  }, []);

  const getDialogState = useCallback((type: StudioDialogType) => {
    switch (type) {
      case 'trim':
        return showTrimDialog;
      case 'vocalReplacement':
        return showVocalReplacementDialog;
      case 'arrangementReplacement':
        return showArrangementReplacementDialog;
      case 'remix':
        return showRemixDialog;
      case 'extend':
        return showExtendDialog;
      case 'sectionReplacement':
        return showSectionReplacementDialog;
      case 'stemSeparation':
        return showStemSeparationDialog;
      default:
        return false;
    }
  }, [
    showTrimDialog,
    showVocalReplacementDialog,
    showArrangementReplacementDialog,
    showRemixDialog,
    showExtendDialog,
    showSectionReplacementDialog,
    showStemSeparationDialog,
  ]);

  const openDialog = useCallback((type: StudioDialogType) => {
    getDialogSetter(type)(true);
  }, [getDialogSetter]);

  const closeDialog = useCallback((type: StudioDialogType) => {
    getDialogSetter(type)(false);
  }, [getDialogSetter]);

  const toggleDialog = useCallback((type: StudioDialogType) => {
    getDialogSetter(type)(prev => !prev);
  }, [getDialogSetter]);

  const closeAllDialogs = useCallback(() => {
    setShowTrimDialog(false);
    setShowVocalReplacementDialog(false);
    setShowArrangementReplacementDialog(false);
    setShowRemixDialog(false);
    setShowExtendDialog(false);
    setShowSectionReplacementDialog(false);
    setShowStemSeparationDialog(false);
  }, []);

  return {
    showTrimDialog,
    showVocalReplacementDialog,
    showArrangementReplacementDialog,
    showRemixDialog,
    showExtendDialog,
    showSectionReplacementDialog,
    showStemSeparationDialog,
    openDialog,
    closeDialog,
    toggleDialog,
    setShowTrimDialog,
    setShowVocalReplacementDialog,
    setShowArrangementReplacementDialog,
    setShowRemixDialog,
    setShowExtendDialog,
    setShowSectionReplacementDialog,
    setShowStemSeparationDialog,
    closeAllDialogs,
  };
}
