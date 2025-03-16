/**
 * Formats a number as currency with the provided options
 * 
 * @param value - The number to format as currency
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatCurrency = (
    value: number,
    options: Intl.NumberFormatOptions = {}
  ): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };
  
    return new Intl.NumberFormat('en-NG', defaultOptions).format(value);
  };
  
  /**
   * Formats a date with the provided options
   * 
   * @param date - Date to format (Date object or ISO string)
   * @param options - Intl.DateTimeFormat options
   * @returns Formatted date string
   */
  export const formatDate = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
  
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  };
  
  /**
   * Formats a date and time with the provided options
   * 
   * @param date - Date to format (Date object or ISO string)
   * @param options - Intl.DateTimeFormat options
   * @returns Formatted date and time string
   */
  export const formatDateTime = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      ...options
    };
  
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  };
  
  /**
   * Formats a number with the provided options
   * 
   * @param value - The number to format
   * @param options - Intl.NumberFormat options
   * @returns Formatted number string
   */
  export const formatNumber = (
    value: number,
    options: Intl.NumberFormatOptions = {}
  ): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    };
  
    return new Intl.NumberFormat('en-US', defaultOptions).format(value);
  };
  
  /**
   * Formats a percentage with the provided options
   * 
   * @param value - The decimal value to format as percentage (e.g., 0.1 for 10%)
   * @param options - Intl.NumberFormat options
   * @returns Formatted percentage string
   */
  export const formatPercentage = (
    value: number,
    options: Intl.NumberFormatOptions = {}
  ): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      ...options
    };
  
    return new Intl.NumberFormat('en-US', defaultOptions).format(value);
  };