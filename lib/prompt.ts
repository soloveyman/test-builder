export function buildSystemPrompt(locale: "ru" | "en") {
    const ru = `Ты генератор экзаменационных вопросов для персонала HoReCa. Используй Только предоставленный контекст. Внешние знания запрещены.
    Верни чистый JSON-массив вопросов РАЗНЫХ ТИПОВ. Автоматически выбирай подходящие типы вопросов на основе контекста.
    Поддерживаемые типы: mcq_single (alias mcq), mcq_multi, tf, complete, cloze, match, order.
    
    СТРАТЕГИЯ СМЕШИВАНИЯ:
    - 40-50%: mcq_single/mcq (основные вопросы)
    - 20-30%: tf (простые проверки)
    - 15-25%: complete (заполнение пропусков)
    - 10-20%: mcq_multi (сложные множественные)
    - 5-15%: cloze/match/order (специальные форматы)
    
    Правила:
    - Для mcq_single: 3–5 вариантов, ровно один правильный (answer = index).
    - Для mcq_multi: 4–6 вариантов, 2–3 правильных (answer = [indices]).
    - Для tf: answer = true/false.
    - Для complete: в prompt есть "__", answer = строка ≤20 символов.
    - Для cloze: несколько пропусков с вариантами (choices = {A:[..],B:[..]}, answer = {A:0,B:1}).
    - Для match: pairs = [{left,rightOptions[],answer}].
    - Для order: choices[], answer = перестановка индексов.
    Язык вывода: ${locale}.`;
    
    
    const en = `You generate exam questions for HoReCa staff. Use ONLY the provided context. No external knowledge.
    Return a pure JSON array of questions with MIXED TYPES. Automatically choose appropriate question types based on context.
    Supported types: mcq_single (alias mcq), mcq_multi, tf, complete, cloze, match, order.
    
    MIXING STRATEGY:
    - 40-50%: mcq_single/mcq (main questions)
    - 20-30%: tf (simple checks)
    - 15-25%: complete (fill-in-the-blank)
    - 10-20%: mcq_multi (complex multiple choice)
    - 5-15%: cloze/match/order (special formats)
    
    Rules similar to RU above. Output language: ${locale}.`;
    
    
    return locale === "ru" ? ru : en;
    }
    
    
    export function buildUserPrompt(params: {
    count: number; difficulty: "easy"|"medium"|"hard"; locale: "ru"|"en";
    contextText?: string; facts?: any[]; steps?: any[]; definitions?: any[]; sourceRefs?: string[];
    questionTypes?: string[];
    }) {
    const { count, difficulty, locale, contextText, facts, steps, definitions, questionTypes } = params;
    const header = `Параметры:\n– Количество: ${count};\n– Сложность: ${difficulty}; язык: ${locale}.\n– Типы вопросов: ${questionTypes ? questionTypes.join(', ') : 'автоматический выбор на основе контекста'}.\nКонтекст (фрагменты документа):`;
    const body: string[] = [];
    if (contextText) body.push(contextText);
    if (facts?.length) body.push(`facts: ${JSON.stringify(facts)}`);
    if (steps?.length) body.push(`steps: ${JSON.stringify(steps)}`);
    if (definitions?.length) body.push(`definitions: ${JSON.stringify(definitions)}`);
    const policy = `\nПросьба: формулируй чётко, не копируй большие куски, обязательно добавляй краткое объяснение и source, если можно. Создавай разнообразные типы вопросов для лучшего тестирования знаний.`;
    return `${header}\n${body.join("\n\n")}\n${policy}`;
    }