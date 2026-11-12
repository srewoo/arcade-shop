// Parsed query string. Recognised flags (all optional):
//   ?map=<id>  ?fps=1  ?demo=1[&t=<seconds>]  ?race=1[&trial=1]  ?touch  ?ui=0
//   ?v=1|0 (force portrait/landscape)  ?w=<px> ?h=<px> (force stage size)  ?q=fixed (disable adaptive resolution)
// Original: `In`.
export const query = new URLSearchParams(location.search);
