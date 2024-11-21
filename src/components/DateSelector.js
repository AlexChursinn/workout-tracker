import React, { useState, forwardRef, useImperativeHandle } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import './DateSelector.css'; // Подключаем CSS для кастомных стилей

registerLocale('ru', ru);

const DateSelector = forwardRef(({ selectedDate, onDateSelect, filledDates }, ref) => {
  const [openCalendar, setOpenCalendar] = useState(false);

  const highlightedDates = filledDates.map((date) => new Date(date).setHours(0, 0, 0, 0));

  const renderDayContents = (day, date) => {
    const dateTime = date.setHours(0, 0, 0, 0);
    const isFilled = highlightedDates.includes(dateTime);

    return (
      <div
        style={{
          backgroundColor: isFilled ? '#000' : 'transparent',
          color: isFilled ? 'white' : '',
          borderRadius: isFilled ? '50%' : '',
          padding: '5px',
        }}
      >
        {day}
      </div>
    );
  };

  useImperativeHandle(ref, () => ({
    toggleCalendar: () => setOpenCalendar((prev) => !prev),
    openCalendar: () => setOpenCalendar(true),
    closeCalendar: () => setOpenCalendar(false),
  }));

  return (
    <div>
      <h2 className="dateDisplay" onClick={() => setOpenCalendar(!openCalendar)}>
        {selectedDate.toLocaleDateString()}
      </h2>
      {openCalendar && (
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            onDateSelect(date);
            setOpenCalendar(false);
          }}
          inline
          renderDayContents={renderDayContents}
          locale="ru"
          dateFormat="dd.MM.yyyy"
          calendarClassName="custom-datepicker" // Кастомный класс
        />
      )}
    </div>
  );
});

export default DateSelector;
