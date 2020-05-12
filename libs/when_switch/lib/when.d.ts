export declare type Matcher<T, R extends T> = {
    test: ((x: T) => x is R) | ((x: T) => boolean);
};
export declare type When<T, V> = {
    is: <U extends T, W>(matcher: U, returnValue: ((inputValue: U) => W) | W) => When<T, V | W>;
    match: <U extends T, W>(matcher: Matcher<T, U>, returnValue: ((inputValue: U) => W) | W) => When<T, V | W>;
    else: <W>(returnValue: ((inputValue: T) => W) | W) => V | W;
};
export declare const when: <T>(expr: T) => When<T, never>;
export default when;
