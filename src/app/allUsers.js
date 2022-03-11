import { useEffect, useState } from 'react';
import FirebaseService from 'app/services/firebaseService';
import users from './auth/store/usersSlice';
import { useDispatch } from 'react-redux';


function getAllUsers() { 
    const dispatch = useDispatch();

    const [test, setTest] = useState([]);
    const printUsers = () => {
        var users = FirebaseService.db.ref('/users');
        users.on('value', (snapshot) => {
            snapshot.forEach((snap) => {
                const userObject = snap.val()
                console.log(userObject)
                const newDesigners = [...test, userObject];
                setTest(newDesigners);
                return newDesigners
            });
        });
    }
    useEffect(() => {
        printUsers();
    }, [])
    console.log(test)

    dispatch(users(test))
};

export default getAllUsers;
