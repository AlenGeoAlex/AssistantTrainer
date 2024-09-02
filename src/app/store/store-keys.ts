
export class StoreKeys {
    public static readonly PERSIST_ASST : string = "last_used_asst";
    public static readonly PERSIST_AZURE : string = "last_used_storage";
    public static readonly PERSIST_OPEN_AI : string = "last_used_open_ai";

    public static getAssistantToolKey(asstName : string) : string{
        return `tool_param:${asstName.trim().replace(" ","_")}`;
    }

    public static getSystemPromptKey(asstName : string) : string{
        return `system_prompt:${asstName.trim().replace(" ","_")}`;
    }
}