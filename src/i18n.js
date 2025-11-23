import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      sidebar: {
        quick_magnet: 'QUICK MAGNET',
        add_torrent: 'ADD .TORRENT',
        dashboard: 'DASHBOARD',
        settings: 'SETTINGS',
        upload: 'UP',
        download: 'DOWN'
      },
      grid: {
        empty_state: 'SYSTEM IDLE // WAITING FOR INPUT',
        searching: 'SEARCHING METADATA...',
        downloading: 'DOWNLOADING',
        paused: 'PAUSED',
        completed: 'COMPLETED',
        unknown: 'Unknown',
        loading_name: 'Loading Name...',
        speed: 'SPEED',
        peers: 'PEERS',
        size: 'SIZE'
      },
      delete_modal: {
        title: 'CONFIRM DELETION',
        target: 'REMOVE TARGET:',
        keep_files: 'Keep Files',
        delete_data: 'DELETE DATA'
      },
      settings: {
        title: 'SYSTEM CONFIGURATION',
        unsaved: 'WARNING: UNSAVED CHANGES',
        paths: 'DIRECTORIES',
        download_path: 'Download Path',
        connections: 'NETWORK',
        max_conns: 'Max Connections',
        limits: 'LIMITERS',
        dl_limit: 'Download Limit (KB/s)',
        ul_limit: 'Upload Limit (KB/s)',
        language: 'INTERFACE LANGUAGE',
        save: 'COMMIT CHANGES',
        reset: 'FACTORY RESET'
      },
      dialogs: {
        select_folder: 'Select Destination Directory',
        open_file: 'Select .torrent File'
      }
    }
  },
  ru: {
    translation: {
      sidebar: {
        quick_magnet: 'БЫСТРЫЙ MAGNET',
        add_torrent: 'ДОБАВИТЬ .TORRENT',
        dashboard: 'ДАШБОРД',
        settings: 'НАСТРОЙКИ',
        upload: 'ОТДАЧА',
        download: 'ЗАГРУЗКА'
      },
      grid: {
        empty_state: 'СИСТЕМА В ОЖИДАНИИ // НЕТ ЗАДАЧ',
        searching: 'ПОИСК МЕТАДАННЫХ...',
        downloading: 'ЗАГРУЗКА',
        paused: 'ПАУЗА',
        completed: 'ЗАВЕРШЕН',
        unknown: 'Неизвестно',
        loading_name: 'Получение имени...',
        speed: 'СКОРОСТЬ',
        peers: 'ПИРЫ',
        size: 'РАЗМЕР'
      },
      delete_modal: {
        title: 'ПОДТВЕРДИТЕ УДАЛЕНИЕ',
        target: 'ЦЕЛЬ УДАЛЕНИЯ:',
        keep_files: 'Оставить файлы',
        delete_data: 'СТЕРЕТЬ ДАННЫЕ'
      },
      settings: {
        title: 'КОНФИГУРАЦИЯ СИСТЕМЫ',
        unsaved: 'ВНИМАНИЕ: ЕСТЬ НЕСОХРАНЕННЫЕ ИЗМЕНЕНИЯ',
        paths: 'ДИРЕКТОРИИ',
        download_path: 'Путь загрузки',
        connections: 'СЕТЬ',
        max_conns: 'Макс. соединений',
        limits: 'ЛИМИТЫ',
        dl_limit: 'Лимит загрузки (КБ/с)',
        ul_limit: 'Лимит отдачи (КБ/с)',
        language: 'ЯЗЫК ИНТЕРФЕЙСА',
        save: 'ПРИМЕНИТЬ',
        reset: 'ПОЛНЫЙ СБРОС'
      },
      dialogs: {
        select_folder: 'Выберите папку назначения',
        open_file: 'Выберите .torrent файл'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;