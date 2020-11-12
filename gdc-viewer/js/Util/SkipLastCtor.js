define( [
            'dojo/_base/declare'
        ],
        function(
            declare
        ) {

// Creates a subclass of T that skips T's constructor, but none of T's parents'.
// This effectively allows rewriting T's constructor without code duplication.
// Useful for tweaking classes from base JBrowse.
return function(T) {
    return declare('SkipLastCtor', T, {
        '-chains-': {
            constructor: 'manual'
        },
        constructor() {
            let ctor = this.constructor;
            while (ctor.prototype.declaredClass != 'SkipLastCtor') {
                ctor = ctor._meta.parents;
            }
            while (ctor.prototype.declaredClass == 'SkipLastCtor') {
                ctor = ctor._meta.parents;
            }
            const bases = ctor._meta.bases;
            for (var idx = bases.length - 1; idx > 0; idx--) {
                bases[idx]._meta.ctor.apply(this, arguments);
            }
        }
    });
}
});
