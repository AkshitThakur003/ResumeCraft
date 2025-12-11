import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui';
import { Sparkles, Search, FileCheck, ChevronDown, Check } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../ui';
import { FormField, Textarea } from '../ui';
import { cn } from '../../utils';

const ANALYSIS_TYPES = [
  {
    value: 'general',
    label: 'General Analysis',
    description: 'Comprehensive resume review with overall scores and recommendations',
    icon: Sparkles,
    color: 'bg-blue-500',
  },
  {
    value: 'ats',
    label: 'ATS Optimization',
    description: 'Analyze resume for Applicant Tracking System compatibility',
    icon: FileCheck,
    color: 'bg-green-500',
  },
  {
    value: 'jd_match',
    label: 'Job Description Match',
    description: 'Compare resume against a specific job description',
    icon: Search,
    color: 'bg-purple-500',
  },
];

export const AnalysisTypeSelector = ({ onSelect, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('general');
  const [jobDescription, setJobDescription] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleSelect = () => {
    onSelect(selectedType, jobDescription.trim() || null);
    setIsOpen(false);
    setJobDescription('');
  };

  const selectedTypeInfo = ANALYSIS_TYPES.find(t => t.value === selectedType);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setDropdownOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Analyze Resume
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader onClose={() => setIsOpen(false)}>
          <ModalTitle>Select Analysis Type</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-6">
            <FormField label="Analysis Type">
              <div className="relative" style={{ zIndex: 1 }}>
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    'flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors',
                    dropdownOpen && 'ring-2 ring-ring'
                  )}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="listbox"
                >
                  <div className="flex items-center gap-2.5">
                    {selectedTypeInfo && (
                      <>
                        <div className={`w-5 h-5 rounded ${selectedTypeInfo.color} flex items-center justify-center flex-shrink-0`}>
                          <selectedTypeInfo.icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium truncate">{selectedTypeInfo.label}</span>
                      </>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 opacity-50 transition-transform flex-shrink-0',
                      dropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-[9999] mt-1.5 w-full rounded-md border bg-popover shadow-xl max-h-[280px] overflow-y-auto"
                    role="listbox"
                    style={{
                      animation: 'fadeInDropdown 0.15s ease-out',
                      top: '100%',
                    }}
                  >
                    <div className="p-1">
                      {ANALYSIS_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleTypeSelect(type.value)}
                            className={cn(
                              'relative flex w-full cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2.5 text-sm',
                              'hover:bg-accent hover:text-accent-foreground',
                              'focus:bg-accent focus:text-accent-foreground',
                              'outline-none transition-colors',
                              isSelected && 'bg-accent'
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className={`w-8 h-8 rounded-lg ${type.color} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {type.description}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </FormField>

            {selectedTypeInfo && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${selectedTypeInfo.color} flex items-center justify-center text-white`}>
                    <selectedTypeInfo.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedTypeInfo.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedTypeInfo.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedType === 'jd_match' && (
              <FormField
                label="Job Description"
                helpText="Paste the job description to compare against your resume"
              >
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[150px] resize-y"
                />
              </FormField>
            )}
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSelect}>
            Start Analysis
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

