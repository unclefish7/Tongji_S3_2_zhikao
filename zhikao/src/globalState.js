// globalState.js
import { ref } from 'vue'
 
const globalState = {
  isRegistered: ref(false),
  currentUserName: ref("")
}

export default globalState