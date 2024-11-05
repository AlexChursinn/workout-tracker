import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru'; // Импортируем русский язык

// Регистрируем русский язык для использования в DatePicker
registerLocale('ru', ru);

const DateSelector = ({ selectedDate, onDateSelect, filledDates }) => {
  const [openCalendar, setOpenCalendar] = useState(false);

  const highlightedDates = filledDates.map(date => new Date(date).setHours(0, 0, 0, 0));

  const renderDayContents = (day, date) => {
    const dateTime = date.setHours(0, 0, 0, 0);
    const isFilled = highlightedDates.includes(dateTime);

    return (
      <div
        style={{
          backgroundColor: isFilled ? '#4CAF50' : 'transparent',
          color: isFilled ? 'white' : '',
          borderRadius: isFilled ? '50%' : '',
          padding: '5px'
        }}
      >
        {day}
      </div>
    );
  };

  return (
    <div>
      <h2 onClick={() => setOpenCalendar(!openCalendar)}>
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
          locale="ru" // Устанавливаем русский язык
          dateFormat="dd.MM.yyyy"
          showPopperArrow={false} // Скрываем стрелку поппера
        />
      )}
    </div>
  );
};

export default DateSelector;
