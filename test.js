const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

arr.reduce((prev, curr, index) => {
  console.log('On', curr)
  console.log('Prev:', prev)
  if (index % 2 === 0) {
    console.log(curr, 'Hit Mod', prev)
    prev.push([curr])
  } else {
    console.log('Fell out', prev)
    prev[prev.length - 1].push(curr)
  }

  console.log('Post', prev)
  return prev
}, [])
