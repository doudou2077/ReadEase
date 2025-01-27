const elmNote = document.getElementById("note") as HTMLInputElement | null;
const elmSave = document.getElementById("save") as HTMLButtonElement | null;

let note: string = localStorage.getItem("note") || "";
if (elmNote) {
  elmNote.value = note;
}

if (elmSave) {
  elmSave.onclick = () => {
    if (elmNote) {
      localStorage.setItem("note", elmNote.value);
    }
  };
}