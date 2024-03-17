import React from 'react'
import Avatar from 'react-avatar'

const Client = ({userName}) => {
  
  return (
    <div className='client'>   
        <Avatar  name={userName || 'User'} size={50} round='15px' />
        <span className='userName'>{userName || 'User'}</span>
    </div>
  )
}

export default Client
