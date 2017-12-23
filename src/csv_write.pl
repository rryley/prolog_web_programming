write_table(Cells, Data) :-
    must_be(integer,Cells),
    must_be(list,Data),
    write_table2(Cells,Data).
 
write_table2(Cells, [H|Rest]) :-
    write(H), Remain is Cells - 1,
    write_table3(Cells, Remain, Rest).

write_table3(_, N, []):- N==0 ->   ! ; throw('table under-run').
write_table3(Cells, Remain, [H|Rest]) :-
 Remain < 1 
 ->( nl, write_table2(Cells, [H|Rest]))
   ;( write(', '), write(H),        
      RemainM1 is Remain - 1,
	  write_table3(Cells, RemainM1, Rest)).


/** <examples>
?- write_table(3,[a1,a2,a3,b1,b2,b3,c1,c2,c3,d1,d2,d3]).

?- write_table(6,[a1,a2,a3,b1,b2,b3,c1,c2,c3,d1,d2,d3]).

% Throws underrun 
?- write_table(7,[a1,a2,a3,b1,b2,b3,c1,c2,c3,d1,d2,d3]).
*/
