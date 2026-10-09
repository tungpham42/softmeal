"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type ThemedSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type ThemedSelectOptionGroup = {
  /** The heading displayed above this group of options. */
  label: string;
  options: ThemedSelectOption[];
};

export type ThemedSelectProps = {
  /** Ungrouped options, displayed before any groups. */
  options?: ThemedSelectOption[];
  /** Optional optgroup-like sections, displayed after ungrouped options. */
  groups?: ThemedSelectOptionGroup[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  emptyMessage?: string;
  error?: string;
  className?: string;
  /** Adds a short hint below the control. */
  hint?: string;
};

const EMPTY_OPTIONS: ThemedSelectOption[] = [];
const EMPTY_GROUPS: ThemedSelectOptionGroup[] = [];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`themed-select__chevron${open ? " is-open" : ""}`}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="m5.5 7.5 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="themed-select__check"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="m4.5 10.3 3.6 3.5 7.4-7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function firstEnabled(
  options: ThemedSelectOption[],
  from = 0,
  direction: 1 | -1 = 1,
) {
  for (
    let index = from;
    index >= 0 && index < options.length;
    index += direction
  ) {
    if (!options[index].disabled) return index;
  }
  return options.findIndex((option) => !option.disabled);
}

/**
 * A theme-aware, keyboard-accessible select. It deliberately avoids the browser's
 * native option popup so the menu can follow Món Ăn's warm recipe-notebook theme.
 * Pass `groups` to render optgroup-like headings in the custom dropdown.
 */
export default function ThemedSelect({
  options,
  groups,
  value,
  defaultValue = "",
  onChange,
  label,
  ariaLabel,
  placeholder = "Chọn một tùy chọn",
  name,
  id,
  disabled = false,
  required = false,
  searchable = false,
  emptyMessage = "Không tìm thấy tùy chọn phù hợp",
  error,
  className = "",
  hint,
}: ThemedSelectProps) {
  const generatedId = useId();
  const selectId = id ?? `themed-select-${generatedId}`;
  const labelId = `${selectId}-label`;
  const listboxId = `${selectId}-listbox`;
  const searchId = `${selectId}-search`;
  const isControlled = value !== undefined;

  const topLevelOptions = options ?? EMPTY_OPTIONS;
  const optionGroups = groups ?? EMPTY_GROUPS;

  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : internalValue;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Keep one flat list for selection and keyboard navigation, while retaining
  // the original groups for rendering their headings.
  const allOptions = useMemo(
    () => [
      ...topLevelOptions,
      ...optionGroups.flatMap((group) => group.options),
    ],
    [topLevelOptions, optionGroups],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesQuery = useCallback(
    (option: ThemedSelectOption) =>
      !normalizedQuery ||
      `${option.label} ${option.description ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    [normalizedQuery],
  );

  const visibleTopLevelOptions = useMemo(
    () => topLevelOptions.filter(matchesQuery),
    [topLevelOptions, matchesQuery],
  );

  const visibleGroups = useMemo(
    () =>
      optionGroups
        .map((group) => ({
          ...group,
          options: group.options.filter(matchesQuery),
        }))
        .filter((group) => group.options.length > 0),
    [optionGroups, matchesQuery],
  );

  const filteredOptions = useMemo(
    () => [
      ...visibleTopLevelOptions,
      ...visibleGroups.flatMap((group) => group.options),
    ],
    [visibleTopLevelOptions, visibleGroups],
  );

  const groupsWithIndexes = useMemo(() => {
    return visibleGroups.map((group, index) => ({
      ...group,
      startIndex:
        visibleTopLevelOptions.length +
        visibleGroups
          .slice(0, index)
          .reduce(
            (total, previousGroup) => total + previousGroup.options.length,
            0,
          ),
    }));
  }, [visibleGroups, visibleTopLevelOptions.length]);

  const selectedOption = allOptions.find(
    (option) => option.value === selectedValue,
  );

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openMenu = useCallback(
    (direction: 1 | -1 = 1) => {
      if (disabled) return;
      const selectedIndex = allOptions.findIndex(
        (option) => option.value === selectedValue && !option.disabled,
      );
      const nextIndex =
        selectedIndex >= 0
          ? selectedIndex
          : firstEnabled(
              allOptions,
              direction === 1 ? 0 : allOptions.length - 1,
              direction,
            );
      setActiveIndex(nextIndex);
      setOpen(true);
    },
    [allOptions, disabled, selectedValue],
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    if (searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (open && activeIndex >= 0)
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const selectOption = useCallback(
    (option: ThemedSelectOption) => {
      if (option.disabled) return;
      if (!isControlled) setInternalValue(option.value);
      onChange?.(option.value);
      closeMenu(true);
    },
    [closeMenu, isControlled, onChange],
  );

  const moveActive = (direction: 1 | -1) => {
    if (!filteredOptions.length) return;
    const currentOption = filteredOptions[activeIndex];
    const startingIndex = currentOption
      ? activeIndex
      : direction === 1
        ? -1
        : filteredOptions.length;
    let next = startingIndex;
    for (let count = 0; count < filteredOptions.length; count += 1) {
      next =
        (next + direction + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[next].disabled) {
        setActiveIndex(next);
        return;
      }
    }
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (
      !open &&
      (event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " ")
    ) {
      event.preventDefault();
      openMenu(event.key === "ArrowUp" ? -1 : 1);
      return;
    }
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(firstEnabled(filteredOptions));
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(
        firstEnabled(filteredOptions, filteredOptions.length - 1, -1),
      );
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) selectOption(option);
    } else if (event.key === "Tab") {
      closeMenu();
    }
  };

  const activeOption = filteredOptions[activeIndex];

  const renderOption = (option: ThemedSelectOption, index: number) => {
    const selected = option.value === selectedValue;
    const active = index === activeIndex;

    return (
      <button
        key={`${option.value}-${index}`}
        ref={(node) => {
          optionRefs.current[index] = node;
        }}
        id={`${selectId}-option-${index}`}
        type="button"
        role="option"
        aria-selected={selected}
        aria-disabled={option.disabled || undefined}
        tabIndex={-1}
        disabled={option.disabled}
        className={`themed-select__option${selected ? " is-selected" : ""}${active ? " is-active" : ""}`}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectOption(option)}
      >
        <span className="themed-select__option-copy">
          <span className="themed-select__option-label">{option.label}</span>
          {option.description ? (
            <span className="themed-select__option-description">
              {option.description}
            </span>
          ) : null}
        </span>
        {selected ? (
          <CheckIcon />
        ) : (
          <span className="themed-select__check-spacer" />
        )}
      </button>
    );
  };

  return (
    <div className={`themed-select ${className}`.trim()} ref={rootRef}>
      {label ? (
        <label className="themed-select__label" id={labelId} htmlFor={selectId}>
          {label}
          {required ? (
            <span className="themed-select__required" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        className={`themed-select__trigger${open ? " is-open" : ""}${error ? " has-error" : ""}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? (ariaLabel ?? placeholder) : undefined}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-activedescendant={
          open && activeOption ? `${selectId}-option-${activeIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span
          className={`themed-select__value${selectedOption ? "" : " is-placeholder"}`}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div className="themed-select__popup">
          {searchable ? (
            <div className="themed-select__search-wrap">
              <svg
                aria-hidden="true"
                className="themed-select__search-icon"
                viewBox="0 0 20 20"
                fill="none"
              >
                <circle
                  cx="8.8"
                  cy="8.8"
                  r="5.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m13 13 3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={searchRef}
                id={searchId}
                className="themed-select__search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu(true);
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveActive(1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveActive(-1);
                  } else if (
                    event.key === "Enter" &&
                    filteredOptions[activeIndex]
                  ) {
                    event.preventDefault();
                    selectOption(filteredOptions[activeIndex]);
                  } else if (event.key === "Tab") {
                    closeMenu();
                  }
                }}
                placeholder="Tìm tùy chọn..."
                aria-label="Tìm tùy chọn"
                aria-controls={listboxId}
                aria-activedescendant={
                  activeOption ? `${selectId}-option-${activeIndex}` : undefined
                }
              />
            </div>
          ) : null}

          <div
            className="themed-select__options"
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
          >
            {filteredOptions.length ? (
              <>
                {visibleTopLevelOptions.map((option, index) =>
                  renderOption(option, index),
                )}
                {groupsWithIndexes.map((group, groupIndex) => (
                  <div
                    key={`${group.label}-${groupIndex}`}
                    className="themed-select__group"
                    role="group"
                    aria-label={group.label}
                  >
                    <div className="themed-select__group-label">
                      {group.label}
                    </div>
                    {group.options.map((option, optionIndex) =>
                      renderOption(option, group.startIndex + optionIndex),
                    )}
                  </div>
                ))}
              </>
            ) : (
              <p className="themed-select__empty" role="status">
                {emptyMessage}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      {error ? (
        <p className="themed-select__message is-error" role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="themed-select__message">{hint}</p> : null}
    </div>
  );
}
