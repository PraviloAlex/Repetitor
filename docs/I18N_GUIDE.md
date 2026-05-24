# I18n Guide — Durillo / PrepaMate

> Последнее обновление: 2026-05-23

## Архитектура

Вся локализация живёт в двух файлах:

- `src/i18n/strings.ts` — плоская таблица ключей, два объекта: `ru` и `es`. Экспортирует `StringKey = keyof typeof STRINGS.ru`.
- `src/i18n/skillLabels.ts` — русские переводы для 43 навыков (`getSkillTitleRu`, `getSkillRepairRu`). Хранится отдельно из-за ограничения транспилятора TypeScript на файлы с кириллицей > 16 KB.

Контекст: `src/i18n/I18nContext.tsx` — провайдер с хуком `useI18n()`.

## useI18n()

```ts
const { t, pick, lang, pluralCount } = useI18n();
```

| Функция | Описание |
|---------|----------|
| `t("key")` | Возвращает строку для текущего языка |
| `t("key", { n: "5" })` | Интерполяция переменных `{n}` |
| `pick(localizedText)` | Выбирает `es` или `ru` из `LocalizedText` |
| `lang` | `"ru"` или `"es"` |
| `pluralCount(n, one, few, many)` | Русская плюрализация |

## Правила добавления ключей

1. Добавлять одновременно в `ru` и `es` секции.
2. Имена ключей: `screen_section_detail` (snake_case, без заглавных).
3. Переменные интерполяции: `{varName}` (camelCase внутри фигурных скобок).
4. Кириллица в strings.ts — писать через Python `open(path, 'w', encoding='utf-8')`, не через Edit-инструмент (Windows→Linux mount truncates UTF-8).
5. ES-строки — проверять диакритику: ó, á, ú, ñ, é, í, ¡, ¿.

## Навыки (skillLabels.ts)

```ts
getSkillTitleRu(skillId: string, fallbackEs: string): string
getSkillRepairRu(skillId: string, fallbackEs?: string): string
```

Используется везде, где навык отображается пользователю на русском языке.

## Известные ограничения

- `strings.ts` — всё в одном файле. При добавлении > 200 новых кириллических строк — вынести в отдельный `src/i18n/ru.ts`.
- Плюрализация только для русского. Для испанского достаточно `{n} días` без форм.
- Динамические ключи (`t(\`skill_status_\${status}\`)`) требуют проверки что все варианты значений существуют в strings.ts.
