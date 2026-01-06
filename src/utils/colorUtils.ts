/**
 * Generates a deterministic gradient based on a hash of the input string.
 * This is used for client avatars to make them easily distinguishable
 * without following the admin's theme.
 */
export const getClientGradient = (name: string): string => {
    const gradients = [
        'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/20',
        'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20',
        'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20',
        'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20',
        'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/20',
        'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/20',
        'bg-gradient-to-br from-sky-500 to-sky-600 shadow-sky-500/20',
        'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20',
        'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20',
        'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-500/20',
        'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20',
        'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-fuchsia-500/20',
        'bg-gradient-to-br from-pink-500 to-pink-600 shadow-pink-500/20',
    ];

    // Deterministic hash based on the name
    let hash = 0;
    const cleanName = name || 'Unknown';
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
};
