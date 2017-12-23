%From dmiles prolog irc. I added Stream to handle writing to file.
write_table(Cells, Data) :-
    must_be(integer,Cells),
    must_be(list,Data),
    write_table0(Cells,Data).

write_table0(Cells, [H|Rest]) :-
    write(H),
    Remain is Cells - 1,
    write_table(Cells, Remain, Rest).

write_table(_,N,[]):- N==0 ->   ! ; throw('table under-run').

write_table(Cells, Remain, [H|Rest]) :-
   Remain < 1
   ->
   (nl,
    write_table0(Cells, [H|Rest]))
   ;
   (write(', '),
    write(H),
    RemainM1 is Remain - 1,
	write_table(Cells, RemainM1, Rest)).

/** <examples>
?- write_table(3,[a1,a2,a3,b1,b2,b3,c1,c2,c3,d1,d2,d3]).

?- write_table(6,[a1,a2,a3,b1,b2,b3,c1,c2,c3,d1,d2,d3]).

% Throws underrun
?- write_table(7,[a1,a2,a3,b1,b2,b3,c1,c2,c3,d1,d2,d3]).

*/



% 12/21/2017
% The write_results predicates can be converted to a more general writer
% to csv format by changing nl to a comma, and adding a user supplied
% counter to track how many cells need to be written.
%
% More general solution would call for redirecting stream. To be
% implemented.

dump_table(File, Xpath, First, Last, N) :-
    doc(DOM),
    open(File, write, Handle),
    between(First,Last,N),
    xpath(DOM, Xpath, Data), % N will be user supplied in Xpath uninstantiated
	write_table(Handle, N, Last, Data),
	close(Handle).
/*
% First call checks variables

% First call checks variables
write_table(File, First, Last, Data) :-
    must_be(integer, First),
    must_be(integer, Last),
    write_table_aux(File, First, Last, Data).

write_table_aux(_File, First, Last, Data) :-
    First < Last,
    write(Data),
    write(', ').

write_table_aux(_File, First, Last, Data) :-
    First = Last,
    write(Data),
    nl.

write_table_aux(_File, _First, _Last, _Data) :-
    nl,
    !.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

write_table(File, First, Last, Data) :-
    must_be(integer, First),
    must_be(integer, Last),
    write_table_aux(File, First, Last, Data).

write_table_aux(_File, First, Last, Data) :-
    First < Last,
    write(Data),
    write(', ').

write_table_aux(_File, First, Last, Data) :-
    First = Last,
    write(Data),
    nl.

write_table_aux(_File, _First, _Last, _Data) :-
    nl,
    !.

% Derived from save_to_file.  Need to complete.



This works, but need to figure out how to get all solutions in a list.
between(1,10,N),
findall(Results,
        query_tag(DOM, //(div)/table/tbody/tr(N)/td(text), Results),
        Results).

doc(DOM), between(1,5,M), between(1,6,N),
    xpath(DOM,//(div)/table/tbody/tr(M)/td(N,text), Results).



From Prolog IRC
 forall(( Results = [Rank, Symbol, Name, BTC_Val, USD_Val, Vol_24_Hr,
                    Missing],
   query_tag(DOM, //(div)/table/tbody/tr(1)/td(text), Results)),
   write_results(Results)).

This works well:
between(1,6,N),
    query_tag(DOM, //(div)/table/tbody/tr(N)/td(text), Results),
    Row = [Rank, Symbol, Name, BTC_Val, USD_Val, Vol_24_Hr, Missing],
    Results = Row,
    true.






*/
















