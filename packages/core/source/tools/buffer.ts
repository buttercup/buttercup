export function isTypedArray(arr: any): boolean {
    return /^\[object (Ui|I)nt(8|16|32)(Clamped)?Array\]$/.test(
        Object.prototype.toString.call(arr)
    );
}
