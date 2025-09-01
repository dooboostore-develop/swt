export type Filter = {
    field: string;
    operator: string;
    value: any;
};

export type AvailableField = {
    name: string; // UI에 표시될 이름 (예: Start > Pathname)
    path: string; // 실제 객체 경로 (예: start.pathname)
};

export type AvailableOperator = {
    label: string;
    value: string;
};