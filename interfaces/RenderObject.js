export default function RenderObject({render, getPosition, shouldDispose}) {
    return {
        render(context, iso) {
            render && render(context, iso)
        },
        getPosition() {
            return getPosition && getPosition() || null
        },
        shouldDispose() {
            return shouldDispose && shouldDispose() || false
        }
    }
}
