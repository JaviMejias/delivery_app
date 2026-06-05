import React from 'react';
import Select, { Props as SelectProps } from 'react-select';
import AsyncSelect, { AsyncProps } from 'react-select/async';

const customClassNames = {
  control: (state: any) =>
    `flex items-center justify-between w-full !bg-[var(--sf-surface)] !border-[var(--sf-border)] !border !rounded-xl !min-h-[46px] shadow-sm hover:!border-primary-500/50 transition-all duration-200 cursor-text ${
      state.isFocused ? '!ring-4 !ring-primary-500/20 !border-primary-500' : ''
    }`,
  valueContainer: () => 'flex items-center flex-1 px-4 gap-1',
  input: () => '!text-[var(--sf-text-main)] m-0 p-0',
  singleValue: () => '!text-[var(--sf-text-main)] overflow-hidden text-ellipsis whitespace-nowrap font-medium',
  placeholder: () => '!text-[var(--sf-text-muted)]',
  indicatorsContainer: () => 'flex items-center px-2 text-[var(--sf-text-muted)]',
  indicatorSeparator: () => 'w-px bg-[var(--sf-border)] my-2 mx-1',
  dropdownIndicator: (state: any) =>
    `p-2 hover:!text-primary-400 transition-colors cursor-pointer ${state.isFocused ? '!text-primary-400' : ''}`,
  clearIndicator: () => 'p-2 hover:!text-red-400 transition-colors cursor-pointer',
  menu: () => '!bg-[var(--sf-surface)] !border !border-[var(--sf-border)] !rounded-2xl !shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:!shadow-[0_8px_30px_rgb(0,0,0,0.5)] !mt-1 !mb-1 !overflow-hidden !z-50 backdrop-blur-xl',
  menuList: () => 'p-2 max-h-[300px] overflow-y-auto',
  groupHeading: () => 'px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-[var(--sf-text-muted)]',
  option: (state: any) =>
    `px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center mb-1 last:mb-0 ${
      state.isSelected
        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-md shadow-primary-500/20'
        : state.isFocused
        ? 'bg-primary-500/10 text-primary-400'
        : 'text-[var(--sf-text-main)] hover:bg-[var(--sf-bg)]'
    }`,
  noOptionsMessage: () => 'text-[var(--sf-text-muted)] p-4 text-center font-medium',
  loadingMessage: () => 'text-[var(--sf-text-muted)] p-4 text-center font-medium',
};

export function CustomSelect<Option = unknown, IsMulti extends boolean = false, Group extends import('react-select').GroupBase<Option> = import('react-select').GroupBase<Option>>(
  props: SelectProps<Option, IsMulti, Group>
) {
  return (
    <Select
      unstyled
      classNames={customClassNames}
      noOptionsMessage={() => "No hay resultados"}
      loadingMessage={() => "Cargando..."}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 9999 })
      }}
      {...props}
    />
  );
}

export function CustomAsyncSelect<Option = unknown, IsMulti extends boolean = false, Group extends import('react-select').GroupBase<Option> = import('react-select').GroupBase<Option>>(
  props: AsyncProps<Option, IsMulti, Group>
) {
  return (
    <AsyncSelect
      unstyled
      classNames={customClassNames}
      noOptionsMessage={() => "No hay resultados"}
      loadingMessage={() => "Cargando..."}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 9999 })
      }}
      {...props}
    />
  );
}
