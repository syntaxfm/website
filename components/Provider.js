import React from 'react'

export const Context = React.createContext();

export default class Provider extends React.Component {
  state = {
    topOfShow: 0,
    topOfShowNotes: 0,
  }

  componentDidMount = () => {
    const topOfShowNotes = document.querySelector(".showNotes").offsetTop;
    this.setState({
      topOfShowNotes,
    });
  }
  
  showClicked = (show) => {
    const player = document.querySelector('.player');
    const topOfShow = show.offsetTop - player.offsetHeight;
    
    this.setState({
      topOfShow,
    })

    const mobileOffset = window.innerWidth > 650 ? 105 : 170
    const topOfShowNotes = document.querySelector(".showNotes").offsetTop - mobileOffset;
    
    window.scroll({
      top: topOfShowNotes,
      left: 0,
      behavior: 'smooth',
    });
  }

  backToShowClicked = () => {
    const { topOfShow } = this.state;
    window.scroll({
      top: topOfShow,
      left: 0,
      behavior: 'smooth',
    });
  } 

  render() {
    return (
      <Context.Provider value={{
        state: this.state,
        showClicked: this.showClicked,
        backToShowClicked: this.backToShowClicked,
      }}>
        {this.props.children}
      </Context.Provider>
    )
  }
}
