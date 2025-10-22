export function buildSystemPrompt(locale: "ru" | "en") {
    const ru = `Ты генератор экзаменационных вопросов для персонала HoReCa. Используй Только предоставленный контекст. Внешние знания запрещены.
    Верни чистый JSON-массив вопросов. Поддерживаемые типы: mcq_single (alias mcq), mcq_multi, tf, complete, cloze, match, order.
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
    Return a pure JSON array of questions. Supported types: mcq_single (alias mcq), mcq_multi, tf, complete, cloze, match, order.
    Rules similar to RU above. Output language: ${locale}.`;
    
    
    return locale === "ru" ? ru : en;
    }
    
    
    export function buildUserPrompt(params: {
    count: number; type: string; difficulty: "easy"|"medium"|"hard"; locale: "ru"|"en";
    contextText?: string; facts?: any[]; steps?: any[]; definitions?: any[]; sourceRefs?: string[];
    }) {
    const { count, type, difficulty, locale, contextText, facts, steps, definitions } = params;
    const header = `Параметры:\n– Количество: ${count};\n– Тип: ${type}; сложность: ${difficulty}; язык: ${locale}.\nКонтекст (фрагменты документа):`;
    const body: string[] = [];
    if (contextText) body.push(contextText);
    if (facts?.length) body.push(`facts: ${JSON.stringify(facts)}`);
    if (steps?.length) body.push(`steps: ${JSON.stringify(steps)}`);
    if (definitions?.length) body.push(`definitions: ${JSON.stringify(definitions)}`);
    const policy = `\nПросьба: формулируй чётко, не копируй большие куски, обязательно добавляй краткое объяснение и source, если можно.`;
    return `${header}\n${body.join("\n\n")}\n${policy}`;
    }