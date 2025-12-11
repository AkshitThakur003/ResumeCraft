import React from 'react';
import { Select, FormField } from '../ui';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui';

export const ResumeFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters = filters.status !== 'all' || filters.sort !== '-uploadDate' || filters.tag;

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Status">
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </Select>
        </FormField>

        <FormField label="Sort By">
          <Select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
          >
            <option value="-uploadDate">Newest First</option>
            <option value="uploadDate">Oldest First</option>
            <option value="-lastAnalyzed">Recently Analyzed</option>
            <option value="title">Title (A-Z)</option>
            <option value="-title">Title (Z-A)</option>
          </Select>
        </FormField>

        <FormField label="View">
          <Select
            value={filters.view}
            onChange={(e) => onFilterChange('view', e.target.value)}
          >
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
          </Select>
        </FormField>
      </div>
    </div>
  );
};

